// Motor do jogo: mundo, física, turnos, IA, captura, fase inicial, campanha, menus e controles
(() => {
  const MS = window.MS, Sfx = MS.Sfx, Art = MS.Art;
  const { WEAPONS, SPECIES, THEMES, STAGES, TYPE_COLOR, TYPE_NAME, typeMult } = MS;

  const VW = 800, H = 500, WATER = 480;     // VW = largura da tela; W = largura do mundo (pode ser maior)
  let W = 800;
  const GRAV = 0.2;           // gravidade base (px/frame²)
  const WALK_MAX = 120;       // distância máxima de caminhada por turno (mapas largos dão um pouco mais)
  const walkMax = () => WALK_MAX + Math.max(0, W - 800) * 0.07;
  const GAME_VERSION = '18/10 bichos-4';    // aparece em ⚙ Ajustes: confere se o navegador pegou a versão nova
  const TURN_TIME = 30 * 60;  // 30 s para mirar e atirar (estourou: passa a vez)
  const WEAK = 0.35;          // abaixo dessa fração de PV o inimigo pode ser capturado
  const PLAYER_COL = '#3a9bff', WILD_COL = '#e0433a', GUEST_COL = '#ffd34d';
  const SAVE_KEY = MS.ORIGINAIS ? 'ms_campaign_orig_v1' : 'ms_campaign_v1', SET_KEY = 'ms_settings_v1';
  // ajustes (menu lateral): brilho da tela e volume do som
  const settings = { bright: 1, vol: 0.6, quality: 'auto', autoLite: false, showFps: false, zoom: 'auto', render: 'webgl', glv: 1 };   // render: 'webgl' | 'svg'   // zoom: 'auto' (desliga no modo leve) | 'on' | 'off'   // quality: 'auto' | 'alta' | 'leve'
  try { const t = JSON.parse(localStorage.getItem(SET_KEY)); if (t) { settings.bright = Math.min(1.5, Math.max(0.6, +t.bright || 1)); settings.vol = Math.min(1, Math.max(0, t.vol === undefined ? 0.6 : +t.vol)); if (['auto', 'alta', 'leve'].includes(t.quality)) settings.quality = t.quality; settings.autoLite = !!t.autoLite; settings.showFps = !!t.showFps; if (['auto', 'on', 'off'].includes(t.zoom)) settings.zoom = t.zoom; if (t.render === 'svg') settings.render = 'svg'; if (!t.glv) settings.autoLite = false; } } catch (_) {}   // com o WebGL, o modo leve automático da versão antiga recomeça desligado
  let settingsOpen = false, drawerT = 0, settingsRow = 0, dragSlider = -1, sliderRects = [];
  const SLIDERS = [
    { key: 'bright', label: 'Brilho', min: 0.6, max: 1.5, def: 1,   fmt: v => Math.round(v * 100) + '%' },
    { key: 'vol',    label: 'Volume', min: 0,   max: 1,   def: 0.6, fmt: v => Math.round(v * 100) + '%' }
  ];
  // modo leve: para aparelhos fracos (Fire TV, TVs, celulares antigos) — menos camadas, menos animação, 30 fps
  let lite = false;
  const aF = () => (lite ? frameNo & ~7 : frameNo);   // relógio das animações enfeite (no modo leve muda a cada 8 quadros)
  const QUALITY_NAME = { auto: 'Automática', alta: 'Alta', leve: 'Leve' };
  function applyQuality() {
    lite = settings.quality === 'leve' || (settings.quality === 'auto' && settings.autoLite);
    document.body.classList.toggle('lite', lite);
    for (const id of ['sSky', 'sFar', 'sNear', 'sMid', 'sWB', 'sWF', 'sFore', 'game']) {
      $(id).setAttribute('shape-rendering', lite ? 'optimizeSpeed' : 'auto');
      $(id).setAttribute('text-rendering', lite ? 'optimizeSpeed' : 'auto');
    }
    dirty = true;
    if (GLR) glSize();
  }
  function cycleQuality(d = 1) {
    const order = ['auto', 'alta', 'leve'];
    settings.quality = order[(order.indexOf(settings.quality) + d + 3) % 3];
    if (settings.quality === 'auto') { settings.autoLite = false; perfN = 0; perfSum = 0; }
    applySettings(); Sfx.click();
  }
  // medidor: se os quadros demoram demais, liga o modo leve sozinho (e lembra para a próxima vez)
  let perfN = 0, perfSum = 0, perfLast = 0;
  function perfSample(ts) {
    if (settings.quality !== 'auto' || settings.autoLite || settingsOpen || typeof ts !== 'number') { perfLast = ts; return; }
    if (perfLast && ts - perfLast < 1000) { perfSum += ts - perfLast; perfN++; }
    perfLast = ts;
    if (perfN >= 90) {
      if (perfSum / perfN > 42) {                 // abaixo de ~24 quadros por segundo
        settings.autoLite = true; applySettings();
        showMsg('Aparelho lento: modo leve ligado (⚙ para mudar)', 170);
      }
      perfN = 0; perfSum = 0;
    }
  }
  function applySettings() {
    $('stage').style.filter = Math.abs(settings.bright - 1) < 0.005 ? '' : `brightness(${settings.bright.toFixed(2)})`;
    applyQuality();
    Sfx.setVolume(settings.vol);
    try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch (_) {}
  }
  function setSlider(i, v) {
    const S = SLIDERS[i]; settings[S.key] = Math.min(S.max, Math.max(S.min, v)); applySettings();
  }
  // tela cheia (esconde a barra do navegador, quando o navegador deixa)
  function toggleFullscreen() {
    const d = document, el = d.documentElement;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else { const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(() => showMsg('Este navegador não deixou abrir em tela cheia', 110)); }
    } catch (_) { showMsg('Este navegador não deixou abrir em tela cheia', 110); }
    setTimeout(fitWrap, 300);
  }
  // o jogo sempre cabe inteiro na janela (TVs e navegadores com barra grande, como o Silk do Fire TV)
  function fitWrap() {
    const w = $('wrap'); if (!w || typeof innerWidth !== 'number') return;
    const help = document.body.classList.contains('touch') ? 0 : 56;
    const avail = Math.max(200, (innerHeight || 600) - help - 8);
    const ww = Math.floor(Math.min((innerWidth || 800) * 0.98, avail * 1.6));
    w.style.width = ww + 'px';
    const st = $('stage'); if (st && st.style) st.style.height = Math.round(ww * 5 / 8) + 'px';
    layoutLayers();
  }
  if (typeof addEventListener === 'function') { addEventListener('resize', () => fitWrap()); addEventListener('fullscreenchange', () => fitWrap()); }
  function toggleSettings(force) {
    settingsOpen = force === undefined ? !settingsOpen : force;
    dragSlider = -1; keys = {}; charging = false; power = 0; Sfx.chargeStop(); Sfx.click();
    uiSel = 0; syncButtons();
  }
  // tipos de bola: a Great e a Ultra têm chance de captura maior e só aparecem como itens pelo campo
  const BALLS = {
    ball:  { name: 'Pokébola',   mul: 1,   col: '#e63b3b', key: 'balls' },
    great: { name: 'Great Ball', mul: 1.5, col: '#2f7fe0', key: 'great' },
    ultra: { name: 'Ultra Ball', mul: 2.3, col: '#f2c230', key: 'ultra' }
  };
  const BALL_ORDER = ['ball', 'great', 'ultra'];
  // versão original: monstrinhos próprios e captura por Ovo de Laço (sem Pokébolas)
  const ORIG = !!MS.ORIGINAIS;
  const ORIG_COL = { brasito: '#e0583a', gotalho: '#4aa8e8', musguinho: '#4fae6a', faiscolino: '#7a6ac8', pedrugo: '#9a8f7c', ventolina: '#a9a0ec',
    caramelo: '#d38a3a', pinscher: '#2a2228', tatubola: '#8c7a62', formiga: '#c8382a', rolabosta: '#2e4a3a',
    galinha: '#e8322a', barata: '#7a3e1c', baiacu: '#e8a83a', camaleao: '#5cbf4a', pombo: '#7a8496', abelha: '#f2c230' };
  // escolta da abelha rainha: 3 abelhinhas voando em volta (somem enquanto o Enxame está no ar)
  const beesOut = u => projs.some(p => p.ownerUnit === u && p.wp.style === 'bee');
  function escortPos(u, i) {
    const S = spOf(u), a = frameNo * 0.07 + i * 2.094 + u.uid;
    return { x: Math.cos(a) * (15 + S.hitR * 0.3) * u.scale, y: (-S.hitY - 8 + Math.sin(a * 1.6) * 6) * u.scale, front: Math.sin(a) > 0, dir: -Math.sin(a) >= 0 ? 1 : -1 };
  }
  const eggCol = sp => ORIG_COL[sp] || '#e0583a';
  const BONE_SVG = `<path d="M-6,-1.6 L6,-1.6 A2.6,2.6 0 1,1 8,-3.4 A2.6,2.6 0 1,1 8,3.4 A2.6,2.6 0 1,1 6,1.6 L-6,1.6 A2.6,2.6 0 1,1 -8,3.4 A2.6,2.6 0 1,1 -8,-3.4 A2.6,2.6 0 1,1 -6,-1.6 Z" fill="#fff6e0" stroke="#2a1f1a" stroke-width="1"/>`;
  const CRUMB_SVG = `<path d="M-8,1 C-9,-4 -4,-7 1,-6.5 C6,-7 9,-3 8,2 C6,5 -5,5 -8,1 Z" fill="#e8c070" stroke="#2a1f1a" stroke-width="1" stroke-linejoin="round"/><circle cx="-3" cy="-2" r=".9" fill="#b8883a"/><circle cx="3" cy="-3.5" r=".8" fill="#b8883a"/><circle cx="4" cy="1" r=".9" fill="#b8883a"/>`;
  const DUNG_SVG = `<circle r="7" fill="#7a5230" stroke="#2a1f1a" stroke-width="1.1"/><path d="M-4,-3 q2,-1.5 3.5,.8 M1.5,3 q2,-.8 3,1.4 M-2,4 q.8,-1.4 2,-.8" fill="none" stroke="#5a3a20" stroke-width="1" stroke-linecap="round"/>`;
  const EGG_P = `<ellipse cx="0" cy="0" rx="5" ry="6.2" fill="#fff6e0" stroke="#2a1f1a" stroke-width="1"/><ellipse cx="-1.8" cy="-2.4" rx="1.1" ry="1.8" fill="#fff" opacity=".9"/>`;
  const ROACH_P = `<ellipse cx="0" cy="0" rx="7" ry="4" fill="#7a3e1c" stroke="#2a1f1a" stroke-width="1"/><path d="M-2,-3 C-8,-9 -12,-6 -9,-2 Z" fill="#c8a07a" fill-opacity=".8" stroke="#2a1f1a" stroke-width=".7"/><circle cx="6" cy="0" r="3.2" fill="#8a4a24" stroke="#2a1f1a" stroke-width=".8"/><circle cx="7" cy="-.8" r="1.1" fill="#fff"/><path d="M8,-2 Q12,-6 15,-5 M8,1 Q12,-2 15,0" fill="none" stroke="#2a1f1a" stroke-width=".8"/>`;
  const SPIKE_P = `<path d="M-7,-1.4 L7,0 L-7,1.4 Z" fill="#f6e6b0" stroke="#2a1f1a" stroke-width=".8" stroke-linejoin="round"/>`;
  const TONGUE_P = `<circle r="4.6" fill="#ff6a8a" stroke="#2a1f1a" stroke-width="1"/><ellipse cx="-1.4" cy="-1.6" rx="1.4" ry="1" fill="#ffb0c0"/>`;
  const POOP_P = `<path d="M-4.6,2 C-6,-1 -3,-4 0,-5 C1,-3 4,-3 4.6,0 C5.4,3 2,4.6 0,4.4 C-2,4.6 -4,4 -4.6,2 Z" fill="#f0ece4" stroke="#6a6a6a" stroke-width=".9"/><path d="M-2,0 q2,1.2 4,0" stroke="#9a9a9a" stroke-width=".8" fill="none"/>`;
  const NET_SVG = `<g stroke="#e8f4ff" stroke-width=".9" fill="rgba(232,244,255,.18)"><circle r="8"/><circle r="4.4" fill="none"/><path d="M-8,0H8M0,-8V8M-5.7,-5.7L5.7,5.7M5.7,-5.7L-5.7,5.7" fill="none"/></g><g fill="#c98a2a"><circle cx="8" cy="0" r="1.3"/><circle cx="-8" cy="0" r="1.3"/><circle cx="0" cy="8" r="1.3"/><circle cx="0" cy="-8" r="1.3"/></g>`;
  const eggSvg = col => `<ellipse cx="0" cy="-7.5" rx="6.2" ry="7.6" fill="#fff6e0" stroke="#3a2a33" stroke-width="1.1"/>
    <path d="M-5.4,-5 l2.4,-2 l2.2,2.2 l2.4,-2.2 l2.2,2.2 l2,-1.8" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="-2" cy="-11" r="1.5" fill="${col}"/><circle cx="2.6" cy="-12.4" r="1" fill="${col}"/><circle cx="2.4" cy="-2.6" r="1.2" fill="${col}"/>
    <ellipse cx="-2.4" cy="-11.8" rx="1.2" ry="2" fill="#fff" opacity=".8"/>`;
  // clima: só em cenários ao ar livre (a Caverna não tem). Reforça golpes de certos tipos
  const WEATHER = {
    rain:  { name: 'Chuva',       note: 'Água +50%',            boost: { water: 1.5 } },
    sun:   { name: 'Sol forte',   note: 'Fogo e Planta +40%',   boost: { fire: 1.4, grass: 1.4 } },
    storm: { name: 'Tempestade',  note: 'Elétrico +50%',        boost: { electric: 1.5 } },
    snow:  { name: 'Neve',        note: 'Gelo +50%',            boost: { ice: 1.5 } }
  };

  // busca de elementos com cache (o jogo procura os mesmos elementos centenas de vezes por quadro)
  const _els = {};
  const $ = id => { const e = _els[id]; return e && e.isConnected ? e : (_els[id] = document.getElementById(id)); };
  // não reescreve o DOM quando o conteúdo é idêntico ao do quadro anterior (menos repintura = menos calor/bateria)
  const _setHtml = typeof Element !== 'undefined' ? Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') : null;
  function cacheHtml(ids) {
    if (!_setHtml) return;
    for (const id of ids) {
      const el = document.getElementById(id); let last = null;
      Object.defineProperty(el, 'innerHTML', { configurable: true, get() { return last === null ? _setHtml.get.call(el) : last; },
        set(v) { v = String(v); if (v === last) return; last = v; _setHtml.set.call(el, v); } });
    }
  }
  const _attrCache = new Map();
  function setAttrOnce(id, name, val) {
    const key = id + '|' + name;
    if (_attrCache.get(key) === val) return;
    _attrCache.set(key, val); $(id).setAttribute(name, val);
  }
  const f1 = v => (+v).toFixed(1);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // shiny: sorteio por indivíduo selvagem (1/1000) e filtro de matiz só aplicado a quem é shiny
  let shinyP = MS.SHINY_P || 0.001;
  const rollShiny = () => Math.random() < shinyP;
  const shHue = sp => { const h = (((SPECIES[sp].sh || 150) % 360) + 360) % 360; return (Math.round(h / 20) * 20) % 360; };
  const shF = (sp, on) => (on ? ` filter="url(#fh${shHue(sp)})"` : '');
  (() => {
    let d = '';
    for (let n = 0; n < 360; n += 20) d += `<filter id="fh${n}" color-interpolation-filters="sRGB" x="-25%" y="-25%" width="150%" height="150%"><feColorMatrix type="hueRotate" values="${n}"/><feColorMatrix type="saturate" values="1.25"/></filter>`;
    const el = document.getElementById('shDefs'); if (el) el.innerHTML = d;
  })();
  const glint = (t, x, y, s, ph) => {
    const k = Math.max(0, Math.sin(t * 0.09 + ph));
    return k < 0.05 ? '' : `<path transform="translate(${f1(x)} ${f1(y)}) scale(${(s * k).toFixed(2)})" d="M0,-5 L1.3,-1.3 L5,0 L1.3,1.3 L0,5 L-1.3,1.3 L-5,0 L-1.3,-1.3Z" fill="#fff" stroke="#ffe27a" stroke-width=".7" opacity="${k.toFixed(2)}"/>`;
  };

  // ---------- Estado ----------
  let scene = 'menu';          // 'menu' | 'intro' | 'team' | 'battle'
  let kind = 'menu';           // 'menu' | 'intro' | 'campaign'
  let frameNo = 0;
  let heights, grass, tuft, decor = [], graves = [], parts = [], floaters = [], clouds = [], cloudEls = [], fx = [], projs = [];
  let units = [], teams = [], turnTeam = 0, state = 'aim', wind = 0, power = 0, charging = false, angle = 45;
  let walkBudget = WALK_MAX, dirty = true, msg = '', msgT = 0, keys = {};
  let camMoving = false;
  let panX = null, mapArch = 'rolling', panDrag = null, miniDrag = false;   // panX: câmera livre (null = segue o jogador)
  let kbd = false;            // última entrada foi o teclado (Enter numa fase inicia; toque só seleciona)
  let menuPage = 'main', pageNo = 0, wxRounds = 3, wxPrev = null, wxK = 1;
  let guest = null, gCool = 1, gMode = '', gT = 0, gSide = 1, gDelay = 100, lastShotGuest = false, splashU = null, evo = null;
  let weather = null, lightT = 300, bolt = null;
  let bolts = [], beams = [];   // raios do céu esperando para cair; hiper raios em andamento
  let terrAt = 0, windY = 0, windA = 0, windS = 0, turnT = 0, roundTurns = 0;   // vento em qualquer direção; tempo do turno; turnos na rodada
  let netMode = false, lastNet = false, nets = [];   // versão original: rede para pegar ovos
  let ballMode = false, ballType = 'ball', lastBall = false, lastBallType = 'ball', pickups = [], ai = null, cap = null, panel = null, pendingPanel = null;
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
  const curW = u => u.moves[Math.min(u.mi, u.moves.length - 1)];
  const isVar = u => u.mvs !== 'b';
  const stars = mvs => (mvs === 'b' ? '' : mvs.includes('+') ? '★★' : '★');
  const centerOf = u => ({ x: u.x, y: u.y - spOf(u).hitY * u.scale });
  const hitRof = u => spOf(u).hitR * u.scale * (u.hrMul || 1);
  // inclinação do corpo em graus (a faixa de mira gira junto com ela)
  const tiltDeg = u => (u && !u.flying && scene === 'battle' ? (u.tilt || 0) * 180 / Math.PI : 0);
  // elevação = ângulo em relação à horizontal, para o lado em que o Pokémon olha (0 = reto, 90 = para cima)
  const elevOf = (u, a = angle) => (u.face > 0 ? a : 180 - a);
  const fromElev = (u, e) => (u.face > 0 ? e : 180 - e);
  // faixa de elevações possíveis agora: a faixa da espécie (relativa ao corpo) girada pela inclinação do chão
  function aimWindow(u, face = u.face) {
    if (scene !== 'battle' || !u) return [0, 180];
    const r = MS.aimRange(u.sp), t = tiltDeg(u) * face;
    return [r[0] - t, r[1] - t];
  }
  function clampAim(u) { if (!u) return; const [lo, hi] = aimWindow(u); angle = fromElev(u, clamp(elevOf(u), lo, hi)); }
  // boca (de onde sai o golpe) girada junto com o corpo inclinado
  function mouthAt(u, face, ball) {
    const S = spOf(u), dx = face * (ball ? 8 : S.mouth[0]) * u.scale, dy = (ball ? -S.h * 0.6 : S.mouth[1]) * u.scale;
    const t = u.flying ? 0 : (u.tilt || 0), c = Math.cos(t), sn = Math.sin(t);
    return { x: u.x + dx * c - dy * sn, y: u.y + dx * sn + dy * c };
  }
  // atraso: golpes fortes custam mais; andar e demorar também (quem tiver menos atraso joga antes)
  const shotDelay = wk => { const w = WEAPONS[wk]; return w.none ? 400 : Math.round(520 + Math.min(420, (w.dmg || 10) * (w.count || 1) * 3.4)); };
  const extraDelay = () => Math.round((1 - Math.max(0, walkBudget) / walkMax()) * 120 + Math.max(0, TURN_TIME - turnT) / 60 * 5);
  // time menor paga menos atraso por ação: os dois lados atacam no mesmo ritmo (1 contra 3 não fica injusto)
  function teamMul(u) {
    const own = units.filter(v => v.alive && v.team === u.team).length, other = units.filter(v => v.alive && v.team !== u.team && v.team !== 2).length;
    return u.team === 2 || !own || !other ? 1 : Math.sqrt(own / other);
  }
  function payDelay(u, base) { if (u) u.delay = (u.delay || 0) + Math.round((base + extraDelay()) * teamMul(u)); }
  // ordem dos próximos a jogar (sem os visitantes)
  const turnOrder = () => units.filter(v => v.alive && !v.hidden && v.team !== 2 && teams[v.team]).sort((a, b) => a.delay - b.delay || a.team - b.team);

  // ---------- Câmera 2.5D ----------
  const cam = { x: 400, y: 250, z: 1, shake: 0, sx: 0, sy: 0 };

  // zoom desligado no modo leve e no Fire TV: mudar a escala obriga a redesenhar todas as camadas (caro em aparelho fraco)
  const noZoom = () => settings.zoom === 'off' || (settings.zoom !== 'on' && (lite || (!glActive && isFireTV())));   // no WebGL o zoom é barato
  const GL_ZOOM = 2;          // no WebGL: a vez do Pokémon e o tiro ficam em zoom 2x (a arte vetorial continua nítida)
  // depois do tiro: segura 1 s no ponto da batida (vendo o estrago), abre a tela toda e fica aberta até o jogador apertar algo
  let camHold = 0, camWide = false;
  function updateCamera() {
    let tx = 400, ty = 250, tz = 1, k = 0.06;
    const big = glActive && scene === 'battle';
    if (scene === 'menu' || scene === 'team') { tz = 1; }
    else if (state === 'capture' && cap) { tx = cap.x; ty = cap.by - 10; tz = big ? 2.2 : 1.8; k = 0.08; }
    else if (state === 'flying' && projs.length) {
      const p = projs[Math.floor(projs.length / 2)];
      tx = p.x; ty = p.y; tz = scene === 'intro' ? 1.2 : big ? GL_ZOOM : 1.35; k = 0.12;
    } else if (state === 'flying' && (bolts.length || beams.length)) {
      const b = bolts[0] || beams[0]; tx = b.x !== undefined ? b.x : (b.u.x + b.tx) / 2; ty = b.ty !== undefined ? Math.min(b.u.y, b.ty) - 20 : 250; tz = big ? 1.3 : 1.15; k = 0.1;
    } else if (state === 'settle') { tx = focus.x; ty = focus.y; tz = big ? 1.8 : 1.25; }
    else if (state === 'guest' && guest) { tx = guest.x; ty = guest.y - 40; tz = big ? 1.8 : 1.45; }
    else if ((state === 'aim' || state === 'ai') && charging && scene === 'battle') {
      const u = activeUnit(); if (u) { tx = u.x; ty = u.y - 30; tz = big ? GL_ZOOM : 1.15; k = 0.04; }
    } else if ((state === 'aim' || state === 'ai') && scene === 'battle') {
      const u = activeUnit();
      if (state === 'aim' && panX !== null) { tx = panX; k = 0.16; }            // olhando o mapa: sem zoom
      else if (u && big) { tx = u.x; ty = u.y - 30; tz = GL_ZOOM; k = 0.07; }
      else if (u && W > VW) { tx = u.x; k = 0.07; }
    }
    // pós-tiro: batida → tela toda → (ao apertar algo) volta ao atacante
    if (scene === 'battle' && (state === 'settle' || state === 'aim' || state === 'ai')) {
      if (camWide && (charging || keys.left || keys.right || keys.up || keys.down || keys.panL || keys.panR)) camWide = false;
      if (camHold > 0) {
        if (--camHold === 0) camWide = true;
        tx = focus.x; ty = focus.y; tz = big ? GL_ZOOM : 1.35; k = 0.1;
      } else if (camWide) { tx = cam.x; ty = 250; tz = 1; k = 0.06; }
    }
    // sem zoom (modo leve ou ajuste): a câmera só desloca as camadas e o navegador não precisa redesenhá-las em outra escala
    if (noZoom()) tz = 1;
    camMoving = Math.abs(tz - cam.z) * 60 + Math.abs(tx - cam.x) + Math.abs(ty - cam.y) > 1.5;
    cam.z += (tz - cam.z) * k * 0.8;
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
    const vw = VW / cam.z / 2, vh = H / cam.z / 2;
    cam.x = clamp(cam.x, vw, W - vw);
    cam.y = clamp(cam.y, vh, H - vh);
    cam.sx = cam.shake ? rnd(-cam.shake, cam.shake) : 0;
    cam.sy = cam.shake ? rnd(-cam.shake, cam.shake) : 0;
    cam.shake = cam.shake > 0.3 ? cam.shake * 0.88 : 0;
  }

  // f = profundidade da camada (0 = infinito, 1 = mundo, >1 = primeiro plano)
  // ---------- Camadas da tela ----------
  // cada profundidade (fundos, terreno, Pokémon/tiros, primeiro plano) é um <svg> separado; a câmera desloca e aproxima
  // as camadas inteiras por CSS (feito pela placa de vídeo), então andar com a câmera não obriga a repintar o cenário
  const LAYERS = [   // id do container, profundidade (parallax), área desenhada [x0, y0, largura, altura] em função da largura do mundo
    ['cFar', 0.25, w => [-80, 0, w + 200, 500]], ['cNear', 0.5, w => [-80, 0, w + 200, 500]], ['cMid', 0.65, w => [-80, 0, w + 200, 500]],
    ['cWB', 1, w => [-40, -20, w + 80, 540]], ['cWF', 1, w => [-40, -40, w + 80, 580]], ['cFore', 1.3, w => [-100, 0, w * 1.3 + 300, 580]]
  ];
  let stageS = 1;          // pixels de tela por unidade do jogo (800 unidades = largura do palco)
  function layoutLayers() {
    const st = $('stage'); if (!st) return;
    const r = st.getBoundingClientRect ? st.getBoundingClientRect() : { width: 800 };
    stageS = (r.width || 800) / VW;
    for (const [id, , ext] of LAYERS) {
      const sv = $(id).firstElementChild || $('s' + id.slice(1)); if (!sv || !sv.style) continue;
      const [x0, y0, lw, lh] = ext(W);
      sv.setAttribute('viewBox', `${x0} ${y0} ${lw} ${lh}`);
      sv.style.left = (x0 * stageS) + 'px'; sv.style.top = (y0 * stageS) + 'px';
      sv.style.width = (lw * stageS) + 'px'; sv.style.height = (lh * stageS) + 'px';
    }
    for (const k in camCss) delete camCss[k];
    if (GLR) { glSize(); glBgDirty = true; }
  }
  const camCss = {};
  function placeLayers() {
    for (const [id, f] of LAYERS) {
      const z = 1 + (cam.z - 1) * f;
      const cx = 400 + (cam.x + cam.sx - 400) * f, cy = 250 + (cam.y + cam.sy - 250) * f;
      const v = `translate(${((400 - cx * z) * stageS).toFixed(1)}px,${((250 - cy * z) * stageS).toFixed(1)}px) scale(${z.toFixed(3)})`;
      if (camCss[id] !== v) { camCss[id] = v; $(id).style.transform = v; }
    }
  }
  function camT(f) {
    const z = 1 + (cam.z - 1) * f;
    const cx = 400 + (cam.x + cam.sx - 400) * f, cy = 250 + (cam.y + cam.sy - 250) * f;
    return `translate(400 250) scale(${z.toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})`;
  }

  const FX_FILL = { bee: '#ffd34d', egg: '#fff6e0', roach: '#c8a07a', spike: '#f6e6b0', tongue: '#ff8aa0', poop: '#e8e4dc', bone: '#fff3d6', crumb: '#f0c878', dung: '#8a6038', fire: 'url(#boom)', leaf: 'url(#leafBoom)', water: 'url(#splash)', thunder: 'url(#zap)',
                    normal: 'url(#hitBoom)', gust: 'url(#gustBoom)', web: 'url(#webBoom)', dragon: 'url(#dragBoom)', rock: 'url(#rockBoom)', poison: '#b46bd0', ice: '#bfeaf6', ghost: '#8a6ac0', punch: '#fff0c8', psy: '#ff8ad0', sound: 'rgba(191,233,255,.7)', powder: 'rgba(226,210,255,.7)' };

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
    glBgDirty = true;
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

  const ARCH = {
    rolling: { name: 'Colinas', w: 3 }, flat: { name: 'Planície', w: 1.5 }, valley: { name: 'Vale', w: 2 },
    slope: { name: 'Ladeira', w: 1.5 }, mesas: { name: 'Platôs', w: 1.5 }, spires: { name: 'Pontas', w: 1.2 }
  };
  function rollArch() {
    const keys = Object.keys(ARCH); let r = Math.random() * keys.reduce((a, k) => a + ARCH[k].w, 0);
    for (const k of keys) { r -= ARCH[k].w; if (r <= 0) return k; }
    return 'rolling';
  }

  // ---------- Terreno destrutível: máscara de pixels (1 = chão) ----------
  // A física usa a máscara (buracos, túneis e ilhas de verdade); a tela usa o contorno dela, desenhado em SVG.
  let mask = new Uint8Array(VW * H), terrDirty = true, scorch = [], terrPh = [0, 0];
  const solid = (x, y) => { x = Math.floor(x); y = Math.floor(y); return x >= 0 && x < W && y >= 0 && y < H && mask[y * W + x] === 1; };
  // primeira linha de chão na coluna x, procurando de y0 para baixo (H + 200 = nada: vão / água)
  function surf(x, y0 = 0) {
    x = Math.floor(x); if (x < 0 || x >= W) return H + 200;
    for (let y = Math.max(0, Math.floor(y0)); y < H; y++) if (mask[y * W + x]) return y;
    return H + 200;
  }
  function syncTop(x0, x1) { for (let x = Math.max(0, x0 | 0); x <= Math.min(W - 1, Math.ceil(x1)); x++) heights[x] = surf(x, 0); }
  function fillMask(top, bot) {
    mask = new Uint8Array(W * H); scorch = [];
    for (let x = 0; x < W; x++) {
      if (bot[x] < 0) continue;
      for (let y = Math.max(0, Math.ceil(top[x])), y1 = Math.min(H, Math.floor(bot[x])); y < y1; y++) mask[y * W + x] = 1;
    }
    syncTop(0, W - 1); terrDirty = true; dirty = true;
  }
  // divide o mapa em ilhas: mapas largos têm mais ilhas, sempre com vãos para cair
  function islandSpans() {
    const n = Math.max(2, Math.round(W / rnd(320, 470)));
    const x0 = rnd(0, 24), x1 = W - rnd(0, 24);
    const gaps = Array.from({ length: n - 1 }, () => rnd(44, 92));
    const ws = Array.from({ length: n }, () => rnd(0.7, 1.3)), sw = ws.reduce((a, b) => a + b, 0);
    const usable = x1 - x0 - gaps.reduce((a, b) => a + b, 0);
    const out = []; let x = x0;
    for (let i = 0; i < n; i++) { const w = usable * ws[i] / sw; out.push([x, x + w]); x += w + (gaps[i] || 0); }
    return out;
  }
  // um ponto de pé firme perto de x (longe das bordas das ilhas)
  function landX(x) {
    const ok = xx => xx > 14 && xx < W - 14 && [-16, 0, 16].every(d => surf(xx + d) < WATER - 30) && Math.abs(surf(xx - 12) - surf(xx + 12)) < 30;
    for (let d = 0; d < W; d += 3) for (const s of [1, -1]) { const xx = x + s * d; if (ok(xx)) return xx; }
    return x;
  }
  // contorno da máscara (marching squares em grade de 2 px), suavizado: vira o "d" de um path SVG
  function terrainPath() {
    const C = 2, GW = Math.ceil(W / C) + 3, GH = Math.ceil(H / C) + 3;
    const v = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const x = (i - 1) * C, y = (j - 1) * C;
      v[j * GW + i] = (x >= 0 && x < W && y >= 0 && y < H && mask[y * W + x]) ? 1 : 0;
    }
    // arestas: id par = horizontal (i,j)-(i+1,j), ímpar = vertical (i,j)-(i,j+1); cada ponto de aresta liga 2 segmentos
    const link = new Map();
    const add = (a, b) => { (link.get(a) || link.set(a, []).get(a)).push(b); (link.get(b) || link.set(b, []).get(b)).push(a); };
    for (let j = 0; j < GH - 1; j++) for (let i = 0; i < GW - 1; i++) {
      const tl = v[j * GW + i], tr = v[j * GW + i + 1], br = v[(j + 1) * GW + i + 1], bl = v[(j + 1) * GW + i];
      const c = tl * 8 + tr * 4 + br * 2 + bl;
      if (c === 0 || c === 15) continue;
      const T = (j * GW + i) * 2, B = ((j + 1) * GW + i) * 2, L = (j * GW + i) * 2 + 1, R = (j * GW + i + 1) * 2 + 1;
      switch (c) {
        case 1: case 14: add(L, B); break;
        case 2: case 13: add(B, R); break;
        case 3: case 12: add(L, R); break;
        case 4: case 11: add(T, R); break;
        case 6: case 9: add(T, B); break;
        case 7: case 8: add(L, T); break;
        case 5: add(L, T); add(B, R); break;
        case 10: add(T, R); add(L, B); break;
      }
    }
    const pt = id => { const e = id >> 1, i = e % GW, j = (e - i) / GW; return (id & 1) ? [(i - 1) * C, (j - 1) * C + C / 2] : [(i - 1) * C + C / 2, (j - 1) * C]; };
    const seen = new Set(); let d = '';
    for (const start of link.keys()) {
      if (seen.has(start)) continue;
      const loop = []; let prev = -1, cur = start;
      while (cur !== undefined && !seen.has(cur)) {
        seen.add(cur); loop.push(pt(cur));
        const nb = link.get(cur), nx = nb[0] !== prev ? nb[0] : nb[1];
        prev = cur; cur = nx;
      }
      if (loop.length < 3) continue;
      // tira pontos colineares e suaviza os cantos (um passo de Chaikin)
      const simp = [];
      for (let k = 0; k < loop.length; k++) {
        const a = loop[(k + loop.length - 1) % loop.length], b = loop[k], c2 = loop[(k + 1) % loop.length];
        if ((b[0] - a[0]) * (c2[1] - b[1]) !== (b[1] - a[1]) * (c2[0] - b[0])) simp.push(b);
      }
      if (simp.length < 3) continue;
      let s2 = '';
      for (let k = 0; k < simp.length; k++) {
        const a = simp[k], b = simp[(k + 1) % simp.length];
        s2 += (k ? ' L' : 'M') + f1(a[0] * 0.75 + b[0] * 0.25) + ',' + f1(a[1] * 0.75 + b[1] * 0.25) + ' L' + f1(a[0] * 0.25 + b[0] * 0.75) + ',' + f1(a[1] * 0.25 + b[1] * 0.75);
      }
      d += s2 + 'Z';
    }
    return d || 'M0,0Z';
  }

  function genWorld(key, ww = VW, arch = 'rolling') {
    W = ww; mapArch = arch; layoutLayers();
    applyTheme(key);
    const T = THEMES[key], base = T.terrain.base;
    const amp = T.terrain.amp * (arch === 'flat' ? 0.4 : arch === 'spires' ? 1.1 : 1);
    const p1 = rnd(0, 6.3), p2 = rnd(0, 6.3), p3 = rnd(0, 6.3);
    terrPh = [p1, p2];
    const nb = Math.round((arch === 'flat' ? 3 : arch === 'spires' ? 9 : 5) * W / 800);
    const sp = arch === 'spires';
    const bumps = Array.from({ length: nb }, () => ({ c: rnd(40, W - 40), w: sp ? rnd(16, 38) : rnd(35, 100), h: sp ? rnd(-120, -45) : rnd(-75, 55) }));
    const vc = rnd(0.35, 0.65) * W, sl = Math.random() < 0.5 ? 1 : -1, m1 = rnd(0.2, 0.32) * W, m2 = rnd(0.68, 0.8) * W;
    heights = new Float32Array(W); grass = new Uint8Array(W).fill(1); tuft = new Float32Array(W);
    const solidGround = arch === 'ground';            // menu e fase da cidade: chão contínuo até a água
    const top = new Float32Array(W), bot = new Float32Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
      let h = base + amp * (26 * Math.sin(x * 0.011 + p1) + 14 * Math.sin(x * 0.029 + p2) + 5 * Math.sin(x * 0.07 + p3));
      for (const b of bumps) h += amp * b.h * Math.exp(-(((x - b.c) / b.w) ** 2));
      if (arch === 'valley') h += 95 * Math.exp(-(((x - vc) / (W * 0.13)) ** 2));
      else if (arch === 'slope') h += sl * (x / W - 0.5) * 120;
      else if (arch === 'mesas') h -= 60 * (Math.exp(-(((x - m1) / (W * 0.1)) ** 4)) + Math.exp(-(((x - m2) / (W * 0.1)) ** 4)));
      top[x] = clamp(h, 150, solidGround ? 440 : 392);
      tuft[x] = rnd(4, 9);
    }
    // ilhas flutuantes: o terreno se parte em blocos com vãos; por baixo, rocha pendurada sobre a água
    for (const [a, b] of (solidGround ? [[0, W - 1]] : islandSpans())) {
      const depth = rnd(105, 175), q1 = rnd(0, 6.3), q2 = rnd(0, 6.3), lip = rnd(28, 48);
      for (let x = Math.max(0, Math.ceil(a)); x <= Math.min(W - 1, Math.floor(b)); x++) {
        if (solidGround) { bot[x] = H; continue; }
        const t = (x - a) / (b - a), edge = Math.sin(Math.PI * t);
        top[x] += (1 - Math.pow(edge, 0.3)) * lip;
        const hang = depth * Math.pow(edge, 0.85) * (0.8 + 0.12 * Math.sin(x * 0.045 + q1) + 0.1 * Math.abs(Math.sin(x * 0.13 + q2)));
        bot[x] = Math.max(top[x] + 20, Math.min(WATER - 14, top[x] + 22 + hang));
      }
    }
    fillMask(top, bot);
    let hmin = 500; for (let x = 0; x < W; x++) if (bot[x] > 0) hmin = Math.min(hmin, top[x]);
    $('dirtRect').setAttribute('width', W); $('dirtTexRect').setAttribute('width', W);
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
    else if (key === 'praia' || key === 'cabo' || key === 'vitoria' || key === 'usina') {
      const pts = []; for (let x = -20; x <= W + 40; x += 70) pts.push({ x, y: rnd(268, 290) });
      tl = hillPath(pts);
    } else {
      tl = `M-60,${H}`;
      const cave = key === 'caverna' || key === 'lava' || key === 'gelo';
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
    let fd = clump(-14, 520, 16, 72) + clump(814 + (W - 800) * 1.3, 520, 16, 72);
    for (let cx = 560; cx < W * 1.3 - 600; cx += rnd(520, 900)) fd += clump(cx, 520, 9, 56);
    $('fore').setAttribute('d', fd);
    $('introBack').innerHTML = '';
    decor = []; dirty = true;
    glFullT = true; glTerrOk = false; glBgDirty = true; glPunches = []; glTFull = true;
    glStartLoad();
  }

  function genDecor(avoid) {
    decor = [];
    const list = THEMES[themeKey].decor;
    if (!list.length) return;
    const nDec = Math.round(11 * W / 800);
    for (let tries = 0; decor.length < nDec && tries < 300 * W / 800; tries++) {
      const x = Math.round(rnd(15, W - 15));
      if (avoid.some(a => Math.abs(a - x) < 28)) continue;
      if (heights[x] >= WATER - 30 || Math.abs(surf(x - 7) - surf(x + 7)) > 12) continue;   // nada de árvore na beira da ilha
      if (decor.some(d => Math.abs(d.x - x) < 26)) continue;
      decor.push({ x, base: heights[x], type: pick(list), s: rnd(0.8, 1.15),
                   col: pick(['#ff6b8a', '#ffd84d', '#ffffff', '#b98cff', '#7ae8ff', '#ff9be8']) });
    }
    dirty = true; glFullT = true;
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

  // ---------- Ovo de Laço (versão original) ----------
  // monstrinho selvagem derrotado sem exagero no dano solta um ovo; um dos seus precisa andar até ele
  // antes que caia na água ou seja destruído por uma explosão. Os ovos chocam ao fim da fase
  let eggs = [], stageEggs = [], eggSeq = 0;
  function dropEgg(u) {
    const overkill = Math.max(0, -u.hp), gentle = overkill <= u.maxhp * 0.35;
    if (!gentle && Math.random() > 0.3) { floaters.push({ x: u.x, y: u.y - 40, t: 0, text: 'Golpe forte demais: sem ovo', col: '#ffffff', size: 11 }); return; }
    eggs.push({ id: ++eggSeq, x: u.x, y: u.y - 12, vy: -3, vx: (Math.random() - 0.5) * 1.6, sp: u.sp, mvs: u.mvs, sh: !!u.sh, t: 0, col: eggCol(u.sp) });
    floaters.push({ x: u.x, y: u.y - 44, t: 0, text: `🥚 Ovo de ${u.name}!`, col: '#ffe27a', size: 14 });
    showMsg(`${u.name} deixou um ovo! Ande até ele para pegar.`, 140);
  }
  function stepEggs() {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i]; e.t++;
      const g = surf(e.x, e.y - 3);
      if (e.y < g - 0.5 || e.vy < 0) { e.vy = Math.min(7, e.vy + 0.25); e.x = clamp(e.x + e.vx, 2, W - 2); e.y = Math.min(e.y + e.vy, g); if (e.y >= g && e.vy > 0) { e.vy = 0; e.vx = 0; } }
      else {                                                       // no chão: rola devagar morro abaixo
        e.y = g; const sl = surf(e.x + 3, e.y - 8) - surf(e.x - 3, e.y - 8);
        if (Math.abs(sl) > 3 && Math.abs(sl) < 30) { e.x = clamp(e.x + Math.sign(sl) * 0.35, 2, W - 2); e.y = surf(e.x, e.y - 6); }
      }
      if (e.y > WATER - 2) {
        for (let k = 0; k < 10; k++) addPart({ x: e.x, y: WATER, vx: rnd(-1.5, 1.5), vy: rnd(-3, -1), g: 0.15, life: 40, max: 40, r: rnd(1.2, 2), col: '#bfe9ff', kind: 'drop' });
        Sfx.splash(); showMsg(`O ovo de ${SPECIES[e.sp].name} caiu na água...`, 110); eggs.splice(i, 1); continue;
      }
    }
    stepNets();
  }
  // rede acertou o ovo: a rede fecha, o ovo voa até quem lançou e fica com ele; choca depois de um turno
  function netCatch(p, e) {
    const i = eggs.indexOf(e); if (i >= 0) eggs.splice(i, 1);
    const u = p.ownerUnit;
    nets.push({ e, u, x: e.x, y: e.y - 8, t: 0 });
    focus = { x: e.x, y: e.y };
    Sfx.ballCatch();
    showMsg(`Ovo de ${SPECIES[e.sp].name} na rede! Choca no próximo turno.`, 130);
  }
  function stepNets() {
    for (let i = nets.length - 1; i >= 0; i--) {
      const n = nets[i]; n.t++;
      if (n.t === 1) spray(n.x, n.y, 12, '#e8f4ff', 2, 0.05, 30, 1.6, 'spark');
      if (n.t > 70) {
        nets.splice(i, 1);
        n.e.u = n.u; n.e.hatchIn = 2; stageEggs.push(n.e);
        if (n.u) floaters.push({ x: n.u.x, y: n.u.y - spOf(n.u).h * n.u.scale - 24, t: 0, text: '🥚 guardado!', col: '#8fe070', size: 13 });
      }
    }
  }
  // posição da rede/ovo durante a animação (fecha no ovo e depois voa em arco até o dono)
  function netPos(n) {
    const k = clamp((n.t - 22) / 48, 0, 1), u = n.u;
    const tx = u ? u.x - u.face * 12 : n.x, ty = u ? u.y - 6 : n.y;
    return { x: n.x + (tx - n.x) * k, y: n.y + (ty - n.y) * k - Math.sin(Math.PI * k) * 40, close: clamp(n.t / 22, 0, 1), k };
  }
  // ovo choca: nasce um filhote do lado de quem guardou o ovo, com metade do tamanho e da força
  function hatchCarried() {
    for (const e of stageEggs) {
      if (e.baby || !(--e.hatchIn <= 0)) continue;
      const c = e.u, x = clamp((c ? c.x : e.x) + (c ? -c.face : 1) * 18, 10, W - 10);
      const b = mkUnit(e.sp, x, 0, c ? c.face : 1, 0.5, e.mvs);
      b.scale = (SPECIES[e.sp].scale || 1) * 0.5; b.dmgMul = 0.5; b.sh = e.sh; b.baby = true; b.rid = -1;
      b.delay = (c ? c.delay : 0) + 40; b.hop = 1;
      if (b.y > WATER - 4 && c) { b.x = c.x; b.y = c.y; }
      units.push(b); teams[0].units.push(b); e.baby = b;
      spray(b.x, b.y - 8, 18, '#fff6e0', 2.6, 0.1, 40, 2, 'chunk'); spray(b.x, b.y - 10, 12, '#ffe27a', 2, 0.02, 40, 1.6, 'spark');
      floaters.push({ x: b.x, y: b.y - 36, t: 0, text: `${b.name} nasceu!`, col: '#ffe27a', size: 15 });
      Sfx.shiny();
    }
  }
  function toggleNet() {
    if (scene !== 'battle' || state !== 'aim' || teams[turnTeam].ai) return;
    if (lastNet) { netMode = true; return; }
    if (!eggs.length) { showMsg('Nenhum ovo no chão para pegar.', 80); Sfx.ballFail(); netMode = false; return; }
    netMode = !netMode; Sfx.click();
    showMsg(netMode ? 'Rede pronta! Acerte o ovo.' : 'Rede guardada.', 80);
  }
  function breakEggs(x, y, r) {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i]; if (Math.hypot(e.x - x, e.y - 7 - y) > r) continue;
      spray(e.x, e.y - 7, 10, '#fff6e0', 2.5, 0.12, 40, 2, 'chunk');
      showMsg(`O ovo de ${SPECIES[e.sp].name} quebrou!`, 110); eggs.splice(i, 1);
    }
  }
  function hatchEggs() {
    for (const e of stageEggs) {                                // só os ovos pegos com a rede (chocados ou não)
      campaign.roster.push(e.sp); campaign.xp.push(0); campaign.mv.push(e.mvs); campaign.sh.push(e.sh ? 1 : 0);
      stageCaught.push({ sp: e.sp, mvs: e.mvs, sh: e.sh });
    }
    // os filhotes vivos crescem até o tamanho normal na frente do jogador
    for (const e of stageEggs) if (e.baby && e.baby.alive) { e.baby.growT = 0; e.baby.growFrom = e.baby.scale; }
    stageEggs = []; eggs = []; nets = [];
  }
  function stepGrow() {
    for (const u of units) {
      if (u.growT === undefined || u.growT >= 100) continue;
      u.growT++;
      const k = u.growT / 100, ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const full = SPECIES[u.sp].scale || 1;
      u.scale = u.growFrom + (full - u.growFrom) * ease;
      if (u.growT % 8 === 0) spray(u.x + rnd(-10, 10), u.y - 10 - rnd(0, 20), 3, '#ffe27a', 1.6, -0.02, 30, 1.6, 'spark');
      if (u.growT === 100) { floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 26, t: 0, text: `${u.name} cresceu e entrou no time!`, col: '#8fe070', size: 14 }); Sfx.evolveDone(); }
      else if (u.growT === 1) Sfx.evolve();
    }
  }
  function resetCommon() {
    fx = []; projs = []; parts = []; floaters = []; graves = []; eggs = []; stageEggs = []; nets = []; netMode = false; lastNet = false;
    power = 0; charging = false; ballMode = false; lastBall = false; pickups = []; weather = null; bolt = null; ai = null; cap = null; panel = null; pendingPanel = null;
    keys = {}; wxPrev = null; wxK = 1;
    guest = null; gCool = 1; gMode = ''; lastShotGuest = false; splashU = null; evo = null;
    roundTurns = 0; windY = 0; windS = 0; turnT = TURN_TIME; bolts = []; beams = [];
    cam.x = 400; cam.y = 250; cam.z = 1; cam.shake = 0;
    Sfx.chargeStop();
  }

  let uidSeq = 0;
  function mkUnit(sp, x, team, face, hpMult = 1, mvs = 'b') {
    const S = SPECIES[sp], maxhp = Math.round(S.maxhp * hpMult);
    mvs = MS.cleanMv(sp, mvs);
    return { uid: ++uidSeq, sp, name: S.name, team, x, y: gy(x), hp: maxhp, maxhp, alive: true, face: face || 1, breath: 0, hurt: 0,
             mvs, moves: MS.movesOf(sp, mvs), mi: 0,
             walkT: 0, moving: false, blinkOff: Math.floor(rnd(0, 230)), webbed: false, stuck: false, hidden: false, capScale: 1,
             scale: S.scale || 1, hop: 0, dealt: 0, rid: -1, turnsLeft: 0, sh: false, flying: false, alt: 0, dot: null, status: null,
             delay: 0, tilt: 0, vy: 0, air: false, lastPow: null };
  }

  // ---------- Menu ----------
  function initMenu() {
    scene = 'menu'; kind = 'menu'; menuPage = 'main'; resetCommon();
    genWorld('campo', VW, 'ground'); genClouds(); genDecor([105, 185, 615, 695]);
    units = ORIG ? [mkUnit('caramelo', 105, 0, 1), mkUnit('tatubola', 185, 0, 1), mkUnit('formiga', 615, 0, -1), mkUnit('pinscher', 695, 0, -1)]
                 : [mkUnit('charmander', 105, 0, 1), mkUnit('bulbasaur', 185, 0, 1), mkUnit('squirtle', 615, 0, -1), mkUnit('pikachu', 695, 0, -1)];
    teams = []; state = 'menu'; wind = 0; msg = ''; msgT = 0; uiSel = 0;
    syncButtons();
  }

  // ---------- Campanha ----------
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && Array.isArray(s.roster) && s.roster.length && s.roster.every(r => SPECIES[r]) &&
          Number.isInteger(s.stage) && s.stage >= 0) {
        s.stage = Math.min(s.stage, STAGES.length - 1);
        s.great = Math.max(0, Math.min(9, +s.great || 0)); s.ultra = Math.max(0, Math.min(9, +s.ultra || 0));
        s.xp = s.roster.map((_, i) => (Array.isArray(s.xp) && +s.xp[i] > 0) ? Math.round(+s.xp[i]) : 0);
        s.mv = s.roster.map((r, i) => MS.cleanMv(r, Array.isArray(s.mv) ? s.mv[i] : 'b'));   // saves antigos: tudo golpe padrão
        s.sh = s.roster.map((_, i) => (Array.isArray(s.sh) && s.sh[i]) ? 1 : 0);
        s.done = !!s.done;
        return s;
      }
    } catch (_) {}
    return null;
  }
  function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ roster: campaign.roster, xp: campaign.xp, mv: campaign.mv, sh: campaign.sh, great: campaign.great, ultra: campaign.ultra, stage: campaign.stage, balls: campaign.balls, weakStart: campaign.weakStart, done: !!campaign.done })); } catch (_) {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} }

  // campaign.stage = fase mais avançada liberada; é possível rejogar qualquer fase anterior (para capturar o que ficou para trás)
  function newCampaign(starter) {
    campaign = { roster: [starter], xp: [0], mv: ['b'], sh: [0], great: 0, ultra: 0, stage: 0, balls: 0, weakStart: SPECIES[starter].maxhp < 100, sel: [0], done: false };
    beginStage(0);
  }
  function loadCampaign() {
    const s = loadSave(); if (!s) return false;
    campaign = { roster: s.roster.slice(), xp: s.xp.slice(), mv: s.mv.slice(), sh: s.sh.slice(), great: s.great, ultra: s.ultra, stage: s.stage, balls: s.balls || 0, weakStart: !!s.weakStart, sel: [0], done: s.done };
    return true;
  }
  function continueCampaign() { if (loadCampaign()) beginStage(campaign.stage); }
  function playStage(si) { if (loadCampaign()) beginStage(Math.min(si, campaign.stage)); }

  function beginStage(si) {
    const replay = si < campaign.stage;
    campaign.stage = Math.max(campaign.stage, si);
    // rejogar uma fase antiga não acumula bolas: só garante um mínimo para tentar de novo
    campaign.balls = replay ? Math.max(campaign.balls, 4) : Math.min(9, campaign.balls + (STAGES[si].boss ? 5 : 3));
    campaign.ballsStart = campaign.balls; campaign.greatStart = campaign.great; campaign.ultraStart = campaign.ultra;
    campaign.rosterStart = campaign.roster.slice();
    campaign.xpStart = campaign.xp.slice(); campaign.mvStart = campaign.mv.slice(); campaign.shStart = campaign.sh.slice();
    if (campaign.roster.length <= 3) {
      campaign.partyIdx = campaign.roster.map((_, i) => i);
      campaign.party = campaign.roster.slice();
      initStage(si);
    } else {
      pageNo = 0;
      campaign.sel = campaign.sel.filter(i => i < campaign.roster.length).slice(0, 3);
      if (!campaign.sel.length) campaign.sel = [0];
      scene = 'team'; kind = 'campaign'; stageIdx = si; resetCommon(); uiSel = 0;
      genWorld(STAGES[si].theme); genClouds(); units = []; teams = []; state = 'menu'; msg = ''; msgT = 0;
      syncButtons();
    }
  }

  // largura do mapa: nem toda fase cabe numa tela
  function pickMapW(si) {
    const r = Math.random();
    if (si === 0) return r < 0.6 ? 800 : 1100;
    const w = r < 0.35 ? 800 : r < 0.65 ? 1100 : r < 0.88 ? 1400 : 1700;
    return STAGES[si].boss ? Math.min(w, 1100) : w;
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const spreadX = (n, a, b) => { const out = [], seg = (b - a) / n; for (let i = 0; i < n; i++) out.push(a + seg * (i + 0.5) + rnd(-seg * 0.22, seg * 0.22)); return out; };
  // posições iniciais: lados opostos, lados trocados ou misturados pelo mapa
  function layoutSpawns(nP, nE) {
    const wide = W > VW, r = Math.random(), n = nP + nE;
    let mode = r < (wide ? 0.4 : 0.6) ? 'sides' : r < (wide ? 0.6 : 0.85) ? 'mirror' : 'mixed';
    if (mapOverride && mapOverride.layout) mode = mapOverride.layout;
    // com ilhas não dá para atravessar os vãos andando: os dois times nascem ao alcance de um tiro (~680 px),
    // num trecho sorteado do mapa; o resto do mapa largo fica para itens e visitantes
    const span = Math.min(W - 120, 680), a = rnd(60, W - 60 - span), b = a + span;
    if (mode === 'mixed') {
      const all = [];
      for (let t = 0; t < 600 && all.length < n; t++) { const x = rnd(a, b); if (all.every(q => Math.abs(q - x) > 85)) all.push(x); }
      if (all.length === n) { shuffle(all); return { mode, px: all.slice(0, nP), ex: all.slice(nP) }; }
      mode = 'sides';
    }
    const band = Math.max(160, span * 0.3);
    const L = spreadX(mode === 'mirror' ? nE : nP, a, a + band), R = spreadX(mode === 'mirror' ? nP : nE, b - band, b);
    return mode === 'mirror' ? { mode, px: R, ex: L } : { mode, px: L, ex: R };
  }
  let mapOverride = null;

  function pickEnemies(st, ww) {
    const base = st.enemies.slice(), out = base.map(sp => ({ sp, mul: 1 }));
    let extra = 0;
    if (!st.boss && st.pool && st.pool.length) extra = Math.floor(rnd(0, 1 + (ww - 800) / 450 + (ww === 800 ? 0.15 : 0)));
    if (mapOverride && mapOverride.extra !== undefined) extra = mapOverride.extra;
    for (let i = 0; i < extra && st.pool.length; i++) out.push({ sp: pick(st.pool), mul: 0.9 });
    return shuffle(out);
  }

  function initStage(si) {
    scene = 'battle'; kind = 'campaign'; stageIdx = si; resetCommon(); stageCaught = [];
    const st = STAGES[si];
    const ww = (mapOverride && mapOverride.w) || pickMapW(si), arch = (mapOverride && mapOverride.arch) || rollArch();
    genWorld(st.theme, ww, arch); genClouds();
    const mercy = (si === 0 && campaign.weakStart) ? 0.75 : 1;
    const foes = pickEnemies(st, ww), party = campaign.partyIdx;
    const lay = layoutSpawns(party.length, foes.length);
    { const taken = []; const put = x => { let xx = landX(x); for (let k = 0; k < 8 && taken.some(t => Math.abs(t - xx) < 34); k++) xx = landX(xx + 40 * (k % 2 ? -1 : 1) * (k + 1)); taken.push(xx); return xx; };
      lay.px = lay.px.map(put); lay.ex = lay.ex.map(put); }
    genDecor(lay.px.concat(lay.ex));
    units = [];
    teams = [
      { name: 'Você', color: PLAYER_COL, units: [], cur: 0, ai: false },
      { name: 'Selvagens', color: WILD_COL, units: [], cur: 0, ai: true }
    ];
    const avgE = lay.ex.reduce((a, b) => a + b, 0) / Math.max(1, lay.ex.length), avgP = lay.px.reduce((a, b) => a + b, 0) / Math.max(1, lay.px.length);
    party.forEach((ri, i) => {
      const u = mkUnit(campaign.roster[ri], lay.px[i], 0, avgE >= lay.px[i] ? 1 : -1, 1, campaign.mv[ri]); u.rid = ri; u.sh = !!campaign.sh[ri]; units.push(u); teams[0].units.push(u);
    });
    gCool = 1 + Math.floor(Math.random() * 2);
    let shinyName = null;
    foes.forEach((e, i) => {
      const u = mkUnit(e.sp, lay.ex[i], 1, avgP >= lay.ex[i] ? 1 : -1, st.hpMult * mercy * e.mul, MS.rollMoves(e.sp, wildBonus(si)));
      u.sh = rollShiny(); if (u.sh) shinyName = u.name;
      units.push(u); teams[1].units.push(u);
    });
    teams[1].cur = teams[1].units.length - 1;
    // atraso inicial: seu time começa, os selvagens entram logo em seguida, intercalados
    teams[0].units.forEach((u, i) => { u.delay = i * 30; });
    teams[1].units.forEach(u => { u.delay = Math.round(rnd(15, 150)); });
    spawnPickups();
    weather = null; lightT = 200 + Math.floor(Math.random() * 200); bolt = null;
    weather = rollWeather(st, null); wxRounds = 3 + Math.floor(Math.random() * 3);
    applyWeatherSky();
    turnTeam = 0; state = 'aim'; panX = null;
    startTurn();
    const au = activeUnit(); if (au) { cam.x = clamp(au.x, VW / 2, Math.max(VW / 2, W - VW / 2)); }
    showMsg(`Fase ${si + 1}: ${st.name}` + (weather ? ` · ${WEATHER[weather].name} (${WEATHER[weather].note})` : '') + (W > VW ? ` · mapa largo` : ''), 170);
    if (shinyName) { setTimeout(() => Sfx.shiny(), 400); showMsg(`✨ ${shinyName} SHINY selvagem! Fase ${si + 1}: ${st.name}`, 200); }
    syncButtons();
  }

  // fases mais avançadas têm mais chance de selvagens com golpes variantes
  const wildBonus = si => Math.min(0.2, si * 0.02);

  // sorteia o clima conforme a lista da fase (o que sobrar da soma das chances = tempo limpo); evita repetir o atual
  function rollWeather(st, avoid) {
    const list = st.weather || [];
    if (!list.length) return null;
    for (let tries = 0; tries < 8; tries++) {
      let roll = Math.random(), w = null;
      for (const e of list) { if (roll < e.p) { w = e.type; break; } roll -= e.p; }
      if (w !== avoid || tries === 7) return w;
    }
    return null;
  }
  // céu fechado (chuva, tempestade, neve) esconde o sol
  function applyWeatherSky() {
    const t = THEMES[themeKey];
    $('sun').style.display = (t.sun && !(weather === 'rain' || weather === 'storm' || weather === 'snow')) ? '' : 'none';
    glSkyDirty = true;
  }
  // de tempos em tempos o clima muda sozinho no meio da fase
  function maybeChangeWeather() {
    const st = STAGES[stageIdx];
    if (!(st.weather || []).length || state === 'over') return;
    if (--wxRounds > 0) return;
    wxRounds = 3 + Math.floor(Math.random() * 4);
    const nw = rollWeather(st, weather);
    if (nw === weather) return;
    wxPrev = weather; wxK = 0; weather = nw; applyWeatherSky();
    if (nw === 'storm') lightT = 120;
    showMsg(nw ? `O tempo mudou: ${WEATHER[nw].name}! (${WEATHER[nw].note})` : 'O tempo abriu.', 130);
    Sfx.voltWarn();
  }

  function restartStage() {
    campaign.roster = campaign.rosterStart.slice();
    campaign.mv = campaign.mvStart.slice(); campaign.sh = campaign.shStart.slice();
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
      const gain = Math.round((50 + 15 * Math.min(stageIdx, 6) + Math.min(70, Math.round((u ? u.dealt : 0) * 0.5))) * (S.xpMul || 1));
      campaign.xp[ri] += gain;
      if (campaign.xp[ri] >= S.evoXp) {
        evos.push({ ri, from: sp, to: S.evo, sh: !!campaign.sh[ri] });
        campaign.roster[ri] = S.evo;
        lines.push(`${S.name}: +${gain} XP — evoluiu para ${SPECIES[S.evo].name}!`);
      } else lines.push(`${S.name}: +${gain} XP (${campaign.xp[ri]}/${S.evoXp})`);
    });
    return { lines, evos };
  }

  function stageClear() {
    state = 'over'; guest = null; units = units.filter(u => u.team !== 2);
    let grow = false;
    if (ORIG) { grow = stageEggs.some(e => e.baby && e.baby.alive); hatchEggs(); }
    const last = stageIdx >= STAGES.length - 1;
    Sfx.win();
    const xp = awardXp();
    if (!last) campaign.stage = Math.max(campaign.stage, stageIdx + 1); else campaign.done = true;
    saveGame();
    const buttons = last
      ? [{ label: 'Menu principal', fn: initMenu }]
      : [{ label: 'Próxima fase ▶', fn: () => beginStage(stageIdx + 1) }, { label: 'Menu', fn: initMenu }];
    pendingPanel = { t: grow ? 150 : 70, evos: xp.evos, panel: {
      title: last ? '🏆 Você é o Campeão!' : 'Fase concluída!',
      sub: last ? `Você terminou a campanha com ${campaign.roster.length} ${ORIG ? 'monstrinhos' : 'Pokémon'}. Dá para rejogar qualquer fase pelo menu.` : `${STAGES[stageIdx].name} superada.`,
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
    const sprite = (sp, white, sc) => `<g transform="translate(400 372) scale(${f1(3.2 * sc)})"${white ? ' filter="url(#fWhite)"' : ''}><g${shF(sp, ev.sh)}>${Art.draw(sp, ctx)}</g></g>`;
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
      title: ORIG ? 'Seus monstrinhos desmaiaram...' : 'Seus Pokémon desmaiaram...', sub: 'Tente de novo com outra estratégia.', lines: [], caught: [],
      buttons: [{ label: 'Tentar de novo', fn: restartStage }, { label: 'Menu', fn: initMenu }] } };
    showMsg('Derrota...', 70);
  }

  // ---------- Itens: Pokébolas espalhadas pelo campo (um motivo para andar) ----------
  function spawnPickups() {
    pickups = [];
    if (ORIG) return;                                            // versão original: sem Pokébolas espalhadas
    const n = 4 + Math.round((W - 800) / 220), x0 = W > VW ? 110 : 270, x1 = W > VW ? W - 110 : 530;
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      const type = roll < 0.5 ? 'ball' : roll < 0.84 ? 'great' : 'ultra';
      for (let tries = 0; tries < 30; tries++) {
        const x = x0 + (x1 - x0) * (i / Math.max(1, n - 1)) + rnd(-22, 22);
        if (gy(x) > WATER - 40 || units.some(u => Math.abs(u.x - x) < 26) || pickups.some(p => Math.abs(p.x - x) < 40)) continue;
        pickups.push({ x, type, ph: rnd(0, 6), id: ++uidSeq }); break;
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

  function pickupItems() {
    return eggs.map(e => ({ k: 'egg' + e.id, t: `translate(${f1(e.x)} ${f1(e.y)})`, h: `<ellipse cx="0" cy=".5" rx="6" ry="1.8" fill="#000" opacity=".25"/><circle class="pulse" cx="0" cy="-8" r="11" fill="${e.col}" opacity=".22"/>
      <g transform="rotate(${f1(Math.sin(frameNo * 0.25 + e.id) * (e.t % 120 < 30 ? 14 : 2))}) scale(1.35)">${eggSvg(e.col)}</g><path d="M-4,-30 L4,-30 L0,-25 Z" fill="#ffe27a"/>` })).concat(pickups.map(p => {
      // o desenho é fixo; flutuar é só o transform do grupo e o brilho pulsa por CSS
      const B = BALLS[p.type], y = gy(p.x), bob = lite ? 0 : Math.sin(frameNo * 0.08 + p.ph) * 3;
      const big = p.type !== 'ball';
      return { k: p.id || p.x, t: `translate(${f1(p.x)} ${f1(y + bob)})`, h: `
        <ellipse cx="0" cy="${f1(1 - 0)}" rx="6" ry="1.8" fill="#000" opacity=".25"/>
        <circle class="pulse" cx="0" cy="-12" r="12.5" fill="${B.col}" opacity=".25"/>
        <g transform="translate(0 -12)">${Art.ball(big ? 7.5 : 6.5, big ? 20 : 0, 0, B.col)}</g>
        <path transform="translate(0 -30)" d="M-3.5,0 L3.5,0 L0,5 Z" fill="${big ? B.col : '#fff'}" stroke="#000" stroke-width=".8" stroke-linejoin="round"/>
        ${big ? `<text x="0" y="-35" text-anchor="middle" font-size="8.5" font-weight="bold" fill="${B.col}" stroke="#000" stroke-width=".6" paint-order="stroke">${p.type === 'great' ? 'GREAT' : 'ULTRA'}</text>` : ''}
      ` };
    }));
  }


  // ---------- Fase inicial: arremessar Pokébolas na cidade ----------
  const TRAINER = { x: 70, y: 420 };
  const POND = { x0: 612, x1: 702, water: 432 };
  const WALL = { x0: 468, x1: 486, top: 335 };
  const ROOF = { x0: 700, top: 292 };

  function initIntro() {
    scene = 'intro'; kind = 'intro'; resetCommon();
    genWorld('cidade', VW, 'ground'); genClouds();
    for (let x = POND.x0; x <= POND.x1; x++) heights[x] = 420 + 32 * Math.sin(Math.PI * (x - POND.x0) / (POND.x1 - POND.x0));
    fillMask(Float32Array.from(heights), new Float32Array(W).fill(H));
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
            groundY: Math.min(surf(x, y - 4), WATER) - 5, landed: false, stars: false };
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

  const weakFoeExists = () => teams[1].units.concat(guest ? [guest] : []).some(u => u.alive && !u.hidden && u.hp / u.maxhp <= WEAK);

  // se o último tiro do jogador foi uma Pokébola, a próxima vez já começa com ela pronta
  function autoBall() {
    if (ORIG) return;
    if (!lastBall || kind !== 'campaign' || !weakFoeExists()) return false;
    const avail = BALL_ORDER.filter(k => campaign[BALLS[k].key] > 0);
    if (!avail.length) return false;
    ballMode = true; ballType = avail.includes(lastBallType) ? lastBallType : avail[0];
    return true;
  }

  function toggleBall() {
    if (ORIG) { toggleNet(); return; }
    if (scene !== 'battle' || kind !== 'campaign' || state !== 'aim' || charging) return;
    const avail = BALL_ORDER.filter(k => campaign[BALLS[k].key] > 0);
    if (ballMode) {            // B de novo: troca para a próxima bola (Great, Ultra) e por fim guarda
      const i = avail.indexOf(ballType);
      if (i >= 0 && i < avail.length - 1) { ballType = avail[i + 1]; Sfx.select(); showMsg(`${BALLS[ballType].name} pronta! (chance maior)`, 90); }
      else { ballMode = false; Sfx.click(); showMsg('Pokébola guardada.', 60); }
      return;
    }
    if (!avail.length) { showMsg('Você está sem Pokébolas!', 90); Sfx.ballFail(); return; }
    if (!weakFoeExists()) {
      showMsg('Nenhum inimigo está fraco o bastante!', 100); Sfx.ballFail(); return;
    }
    ballMode = true; ballType = avail[0]; Sfx.select();
    showMsg(avail.length > 1 ? 'Pokébola pronta! (B troca de bola)' : 'Pokébola pronta! Acerte um inimigo fraco.', 110);
  }

  // ---------- Física e regras ----------
  // explosão abre um buraco de verdade na máscara (pode virar túnel, cratera funda ou partir uma ilha)
  function carve(cx, cy, r, burn = true) {
    if (r <= 0) return;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
    let any = false;
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy, row = y * W;
      for (let x = x0; x <= x1; x++) if (mask[row + x] && (x - cx) * (x - cx) + dy * dy <= r * r) { mask[row + x] = 0; any = true; }
    }
    if (!any) return;
    if (glShader()) glTMark(cx - r - 1, cx + r + 1, burn ? { cx, cy, r } : null);
    else if (glActive) { glPunch(cx, cy, r); glMark(cx - r - 22, cy - r - 30, cx + r + 22, cy + r + 22); }
    for (let x = Math.max(0, Math.floor(cx - r - 8)); x <= Math.min(W - 1, Math.ceil(cx + r + 8)); x++) {
      if (Math.hypot(x - cx, heights[x] - cy) < r + 8) grass[x] = 0;
    }
    for (let x = x0; x <= x1; x++) { const old = heights[x]; heights[x] = surf(x, 0); if (heights[x] !== old) grass[x] = 0; }
    if (burn) { scorch.push({ x: cx, y: cy, r }); if (scorch.length > 240) scorch.shift(); }
    terrDirty = true;
    decor = decor.filter(d => {
      const hit = surf(d.x, d.base - 3) > d.base + 2 || Math.hypot(d.x - cx, d.base - 10 - cy) < r;
      if (hit) { burstDecor(d); glMark(d.x - 50, d.base - 150, d.x + 50, d.base + 14); }
      return !hit;
    });
    dirty = true;
  }

  // Proteção: enquanto a barreira dura, o Pokémon leva só 30% do dano
  const shieldDmg = (u, d) => (u.shield > 0 ? Math.round(d * 0.3) : d);
  // dano direto (raio do céu, hiper raio)
  function zap(u, base, wp, owner) {
    const mult = typeMult(wp.type, spOf(u).types), d = shieldDmg(u, Math.round(base * mult * wxMul(wp.type)));
    if (d <= 0) return 0;
    u.hp -= d; u.hurt = 22;
    floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + d, col: sideColor(u) });
    if (mult > 1) floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Super efetivo!', col: '#ff9a1a', size: 12 });
    if (owner && owner.team === 0 && u.team > 0) owner.dealt += d;
    Sfx.hurt(); return d;
  }
  const sideColor = u => (u.team === 2 ? GUEST_COL : teams[u.team] ? teams[u.team].color : '#fff');

  const wxMul = type => (weather && WEATHER[weather].boost[type]) || 1;

  function explode(x, y, p) {
    const wp = p.wp, style = wp.style;
    if (eggs.length) breakEggs(x, y, wp.boom * 0.6);
    let anyHurt = false, sup = false, weak = false;
    focus = { x, y };
    cam.shake = Math.max(cam.shake, wp.shake !== undefined ? wp.shake : wp.boom / 6);
    Sfx.boom(style);
    if (wp.boom >= 40 || style === 'thunder') { flash.a = Math.min(0.5, wp.boom / 100); flash.col = { fire: '#ffd9a0', dragon: '#c8b0ff', thunder: '#fffbb0', rock: '#e8dcc0' }[style] || '#ffffff'; }
    carve(x, y, wp.carve);
    fx.push({ x, y, t: 0, max: 36, r: wp.boom, fill: FX_FILL[style], style });
    burst(x, y, style);
    for (const u of units) {
      if (!u.alive || u.hidden) continue;
      const c = centerOf(u), d = Math.hypot(c.x - x, c.y - y);
      if (d >= wp.boom) continue;
      const k = 1 - d / wp.boom, mult = typeMult(wp.type, spOf(u).types);
      const dmg = shieldDmg(u, Math.round((u.puffed ? 0.5 : 1) * wp.dmg * k * mult * wxMul(wp.type) * (p.crit ? 1.6 : 1) * ((p.ownerUnit && p.ownerUnit.dmgMul) || 1) * (p.ownerUnit && spOf(p.ownerUnit).furia && p.ownerUnit.hp / p.ownerUnit.maxhp < 0.4 ? 1.5 : 1)));
      if (dmg > 0) {
        u.hp -= dmg; u.hurt = 24; anyHurt = true;
        if (spOf(u).infla && !u.puffed) { u.puffed = true; u.hrMul = 1.35; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 40, t: 6, text: 'Inflou! (metade do dano)', col: '#ffe27a', size: 12 }); }
        if (p.crit && k > 0.2) floaters.push({ x: u.x + 16, y: u.y - spOf(u).h * u.scale - 4, t: 4, text: 'Crítico!', col: '#ff5a5a', size: 12 });
        if (wp.drain && p.ownerUnit && p.ownerUnit.alive && u !== p.ownerUnit) { const h = Math.round(dmg * wp.drain); p.ownerUnit.hp = Math.min(p.ownerUnit.maxhp, p.ownerUnit.hp + h); if (h > 0) floaters.push({ x: p.ownerUnit.x, y: p.ownerUnit.y - spOf(p.ownerUnit).h * p.ownerUnit.scale - 18, t: 0, text: '+' + h, col: '#7be07b' }); }
        if (p.ownerUnit && p.ownerUnit.team === 0 && u.team > 0) p.ownerUnit.dealt += dmg;
        floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + dmg, col: sideColor(u) });
        if (mult > 1 && k > 0.2) { sup = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Super efetivo!', col: '#ff9a1a', size: 12 }); }
        else if (mult < 1 && k > 0.2) { weak = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Pouco efetivo...', col: '#b8c0cc', size: 12 }); }
      }
      if (wp.st && k > 0.2 && u.hp > 0 && Math.random() < wp.st.p) applyStatus(u, wp.st.type);
      if (wp.web && k > 0.15 && !(u.team === 2 && u.webbed)) { u.webbed = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Preso! Perde a vez', col: '#ffffff', size: 12 }); }
      if (wp.push) {                                  // empurrão: desliza pelo chão até bater numa parede
        const dir = (u.x - x) >= 0 ? 1 : -1, n = Math.round(wp.push * k);
        for (let i = 0; i < n; i++) { const ny = u.flying ? u.y : stepTo(u, u.x + dir); if (ny === null) break; u.x += dir; u.y = ny; }
      }
    }
    if (wp.build) raiseTerrain(x, wp.boom + 4, wp.build);
    if (wp.quake) quakeHit(x, p, wp);
    if (wp.chain) chainHit(x, y, p, wp);
    if (wp.pull) pullHit(x, y, p, wp);
    if (wp.bolts) { wp.bolts.forEach((dx, k) => bolts.push({ x: clamp(x + dx, 4, W - 4), t: -(34 + k * 10), dmg: wp.bdmg, wp, owner: p.ownerUnit })); showMsg('Um raio vai cair do céu!', 60); }
    if (wp.beam && p.ownerUnit && p.ownerUnit.alive) beams.push({ u: p.ownerUnit, tx: x, ty: y, wp, t: 0, rise: !!(SPECIES[p.ownerUnit.sp].fly && !p.ownerUnit.flying) });
    if (anyHurt && wxMul(wp.type) > 1) floaters.push({ x, y: y - 30, t: 0, text: WEATHER[weather].name + ' reforça!', col: '#9fe0ff', size: 12 });
    if (anyHurt) Sfx.hurt();
    if (sup) setTimeout(() => Sfx.superEff(), 140);
    else if (weak) setTimeout(() => Sfx.weakEff(), 140);
  }

  const STATUS_TXT = { burn: ['Queimando!', '#ff9a3a'], poison: ['Envenenado!', '#c783e4'], freeze: ['Congelado! Perde a vez', '#bfeaf6'], sleep: ['Dormindo! Perde a vez', '#c8d8ff'], para: ['Paralisado! Perde a vez', '#fff27a'] };
  function applyStatus(u, type) {
    if (!u.alive || u.status) return;
    const T = STATUS_TXT[type]; if (!T) return;
    if (type === 'burn' || type === 'poison') u.dot = { type, turns: 3 };
    else u.webbed = true;
    u.status = type;
    floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 50, t: 8, text: T[0], col: T[1], size: 12 });
  }
  // dano de queimadura/veneno ao fim do turno do time
  function applyDots(team) {
    const only = typeof team === 'object' ? team : null;
    if (only) team = only.team;
    for (const u of units) {
      if (!u.alive || u.team !== team || !u.dot || (only && u !== only)) continue;
      const d = u.dot.type === 'burn' ? 7 : 5;
      u.hp -= d; u.hurt = 14;
      floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + d, col: u.dot.type === 'burn' ? '#ff9a3a' : '#c783e4' });
      if (--u.dot.turns <= 0) { u.dot = null; u.status = null; }
    }
    for (const u of units) if (u.alive && u.team === team && (!only || u === only) && u.status && !u.dot && !u.webbed) u.status = null;
  }
  // Bomba de Lama e afins: ergue chão por cima da superfície (só onde há ilha embaixo)
  function raiseTerrain(cx, r, hgt) {
    let ya = 1e9, yb = -1e9;
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
      const k = 1 - Math.abs(x - cx) / r; if (k <= 0) continue;
      const t0 = heights[x]; if (t0 >= WATER - 2) continue;
      const t1 = Math.max(60, Math.round(t0 - hgt * Math.sqrt(k)));
      for (let y = t1; y < t0; y++) mask[y * W + x] = 1;
      heights[x] = t1; grass[x] = 0; ya = Math.min(ya, t1); yb = Math.max(yb, t0);
    }
    if (yb > ya) { glMark(cx - r - 14, ya - 30, cx + r + 14, yb + 14); glTMark(cx - r - 1, cx + r + 1); }
    terrDirty = true; dirty = true;
  }
  function quakeHit(x, p, wp) {
    cam.shake = Math.max(cam.shake, 9);
    for (const u of units) {
      if (!u.alive || u.hidden || u === p.ownerUnit || u.flying) continue;
      const dx = Math.abs(u.x - x); if (dx >= wp.quake) continue;
      const k = 1 - dx / wp.quake, mult = typeMult(wp.type, spOf(u).types);
      const d = shieldDmg(u, Math.round(wp.dmg * 0.9 * k * mult)); if (d <= 0) continue;
      u.hp -= d; u.hurt = 20; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 4, text: '-' + d, col: sideColor(u) });
      if (u.team === 0 && p.ownerUnit && p.ownerUnit.team !== 0) { /* fogo amigo não conta */ }
    }
    for (let i = 0; i < 18; i++) addPart({ x: x + rnd(-wp.quake, wp.quake), y: gy(x) - 2, vx: rnd(-0.5, 0.5), vy: rnd(-2.5, -0.8), g: 0.14, life: 34, max: 34, r: rnd(1.6, 3), col: '#8a7458', kind: 'ember' });
  }
  // arco elétrico: salta para quem está perto do ponto de impacto
  function chainHit(x, y, p, wp) {
    let n = 0;
    for (const u of units) {
      if (!u.alive || u.hidden || u === p.ownerUnit || n >= 2) continue;
      const c = centerOf(u), d = Math.hypot(c.x - x, c.y - y);
      if (d < wp.boom || d > wp.chain) continue;
      const mult = typeMult(wp.type, spOf(u).types), dm = shieldDmg(u, Math.round(wp.dmg * 0.45 * mult));
      if (dm <= 0) continue;
      u.hp -= dm; u.hurt = 20; n++;
      floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + dm, col: sideColor(u) });
      fx.push({ x, y, x2: c.x, y2: c.y, t: 0, max: 18, r: 0, fill: 'none', bolt: true });
      Sfx.hurt();
    }
  }

  // Redemoinho: puxa para o centro quem estiver perto (pode puxar para dentro de um vão!)
  function pullHit(x, y, p, wp) {
    for (const u of units) {
      if (!u.alive || u.hidden || u === p.ownerUnit) continue;
      const d = Math.abs(u.x - x); if (d > wp.pull || d < 6 || Math.abs(u.y - y) > 110) continue;
      const tx = wp.pullOwner && p.ownerUnit ? p.ownerUnit.x : x;                  // língua: puxa para perto de quem atacou
      const dir = Math.sign(tx - u.x), n = Math.round(Math.min(Math.max(0, Math.abs(tx - u.x) - 16), wp.pullDist * (1 - 0.4 * d / wp.pull)));
      for (let i = 0; i < n; i++) { const ny = u.flying ? u.y : stepTo(u, u.x + dir); if (ny === null) break; u.x += dir; if (!u.flying) u.y = ny; }
      floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Puxado!', col: '#dff6ff', size: 12 });
    }
    for (let i = 0; i < 26; i++) { const a = rnd(0, 6.3), r = rnd(30, wp.pull); addPart({ x: x + Math.cos(a) * r, y: y - 10 + Math.sin(a) * r * 0.4, vx: -Math.cos(a) * 2.2, vy: -Math.sin(a) * 0.8, g: 0, life: 30, max: 30, r: rnd(1.4, 2.6), col: '#ffffff', kind: 'drop' }); }
    Sfx.boom('gust');
  }
  // Raio do Céu: depois do aviso, cai um raio na coluna marcada
  function stepBolts() {
    for (const b of bolts) {
      b.t++;
      if (b.t < 0) { if (b.t % 12 === 0) Sfx.voltWarn(); continue; }
      if (b.t !== 0) continue;
      const sy = Math.min(surf(b.x, 0), WATER);
      const pts = [[b.x + rnd(-10, 10), -40]];
      for (let y = 0; y < sy; y += rnd(26, 46)) pts.push([b.x + rnd(-13, 13), y]);
      pts.push([b.x, sy]);
      for (const u of units) if (u.alive && !u.hidden && Math.abs(u.x - b.x) < 16 + hitRof(u) * 0.6 && u.y <= sy + 30) zap(u, b.dmg, b.wp, b.owner);
      if (sy < WATER) for (let k = 0; k < 4; k++) carve(b.x + rnd(-2, 2), sy + k * 10, 9, k === 3);
      fx.push({ sky: true, pts, x: b.x, y: sy, t: 0, max: 22, r: 0 });
      flash.a = Math.min(0.45, flash.a + 0.3); flash.col = '#fffbb0';
      cam.shake = Math.max(cam.shake, 7); focus = { x: b.x, y: sy };
      spray(b.x, sy, 14, '#fff27a', 3.2, 0.12, 30, 2, 'spark'); Sfx.boom('thunder');
    }
    bolts = bolts.filter(b => b.t < 1);
  }
  // Hiper Raio: o feixe sai do Pokémon até onde o golpe caiu (os voadores sobem antes e descem depois)
  function stepBeams() {
    for (const b of beams) {
      const u = b.u; b.t++;
      const fireAt = b.rise ? 40 : 12;
      if (b.rise && b.t <= 34) u.lift = Math.min(110, (u.lift || 0) + 110 / 34);
      if (b.t === fireAt) fireBeam(b);
      if (b.rise && b.t > fireAt + 26) u.lift = Math.max(0, (u.lift || 0) - 110 / 30);
      b.done = b.t > (b.rise ? fireAt + 60 : fireAt + 28);
      if (b.done) u.lift = 0;
    }
    beams = beams.filter(b => !b.done);
  }
  function fireBeam(b) {
    const u = b.u; if (!u.alive) return;
    u.face = Math.sign(b.tx - u.x) || u.face;
    const m = mouthAt(u, u.face, false), ox = m.x, oy = m.y - (u.lift || 0);
    const dx = b.tx - ox, dy = b.ty - oy, L = Math.hypot(dx, dy) || 1, ex = b.tx + dx / L * 34, ey = b.ty + dy / L * 34;
    for (const v of units) {
      if (!v.alive || v.hidden || v === u) continue;
      const c = centerOf(v), t = clamp(((c.x - ox) * (ex - ox) + (c.y - oy) * (ey - oy)) / ((ex - ox) ** 2 + (ey - oy) ** 2), 0, 1);
      if (Math.hypot(c.x - (ox + (ex - ox) * t), c.y - (oy + (ey - oy) * t)) < hitRof(v) + 8) zap(v, b.wp.beam, b.wp, u);
    }
    for (let k = 26; k <= L + 34; k += 11) carve(ox + dx / L * k, oy + dy / L * k, 6, false);
    fx.push({ beam: true, x: ox, y: oy, x2: ex, y2: ey, t: 0, max: 28, r: 0 });
    flash.a = Math.min(0.5, flash.a + 0.35); flash.col = '#fff6d0'; cam.shake = Math.max(cam.shake, 6);
    u.breath = 24; Sfx.boom('dragon');
  }
  // Teleporte: o Pokémon aparece onde o golpe caiu
  function teleportTo(p, outcome, target) {
    const u = p.ownerUnit; if (!u || !u.alive) return;
    let x = clamp(p.x, 12, W - 12);
    if (target) x = clamp(target.x + (u.x < target.x ? -26 : 26), 12, W - 12);
    const ty = outcome === 'gone' ? H + 200 : surf(x, Math.min(p.y, H) - 40);
    if (ty >= WATER - 4) { showMsg('Teleporte falhou!', 70); Sfx.weakEff(); return; }
    spray(u.x, u.y - 14, 16, '#ff8ad0', 3, 0.02, 34, 2, 'spark');
    u.x = x; u.y = ty; u.vy = 0; u.air = false; focus = { x, y: ty };
    spray(x, ty - 14, 18, '#ffffff', 3, 0.02, 36, 2, 'spark');
    floaters.push({ x, y: ty - spOf(u).h * u.scale - 30, t: 0, text: 'Teleporte!', col: '#ff8ad0', size: 14 });
    Sfx.ballCatch();
  }
  // a superfície logo acima de um ponto debaixo da terra
  function surfAbove(x, y) { let yy = Math.floor(y); while (yy > 0 && solid(x, yy - 1)) yy--; return yy; }

  // Cria os projéteis de um ataque (alguns lançam vários)
  function launch(wk, x, y, a, sp, owner, ownerUnit) {
    const wp = WEAPONS[wk];
    for (let i = 0; i < wp.count; i++) {
      const off = wp.count === 1 ? 0 : (i - (wp.count - 1) / 2) * wp.spread * Math.PI / 180;
      const aa = a + off, s = sp * wp.speed;
      projs.push({ wk, wp, owner, ownerUnit, x, y, vx: s * Math.cos(aa), vy: -s * Math.sin(aa), trail: [], spin: rnd(0, 6), age: 0, bn: wp.bounce || 0, crit: !!wp.crit && Math.random() < wp.crit, sp: false });
    }
  }

  function fire() {
    if (state !== 'aim' && state !== 'ai') return;
    if (glActive && glLoading) return;
    panX = null; camHold = 0; camWide = false;
    const u = activeUnit(); if (!u) return;
    const S = spOf(u), a = angle * Math.PI / 180, sp = 3 + power * 0.075;   // ângulo em relação à horizontal
    u.lastPow = power;
    if (!ballMode && !teams[turnTeam].ai) lastBall = false;      // tiro normal: deixa de repetir a Pokébola
    const wk = curW(u);
    if (!ballMode && WEAPONS[wk].none) {
      payDelay(u, shotDelay(wk));
      u.hop = 1; splashU = u; state = 'skip'; skipT = 80; walkBudget = 0; charging = false; power = 0; ai = null;
      Sfx.chargeStop(); Sfx.splash();
      showMsg(`${u.name} usou Splash! Mas nada aconteceu...`, 80);
      return;
    }
    if (!ballMode && WEAPONS[wk].protect) {                  // Proteção: barreira em volta de si, sem tiro
      payDelay(u, 460);
      u.shield = WEAPONS[wk].protect; u.breath = 18;
      state = 'skip'; skipT = 60; walkBudget = 0; charging = false; power = 0; ai = null;
      Sfx.chargeStop(); Sfx.ballCatch();
      spray(u.x, u.y - spOf(u).hitY * u.scale, 18, '#bff3ff', 3, 0.02, 34, 2, 'spark');
      showMsg(`${u.name} usou Proteção! (${u.shield} turnos)`, 80);
      lastAngles[kind + turnTeam] = elevOf(u);
      return;
    }
    if (ORIG && netMode && !teams[turnTeam].ai) {
      payDelay(u, 360);
      const m = mouthAt(u, u.face, true);
      launch('rede', m.x, m.y, a, sp, 'player', u);
      netMode = false; Sfx.ballThrow(); Sfx.chargeStop();
      lastAngles[kind + turnTeam] = elevOf(u);
      power = 0; charging = false; state = 'flying'; ai = null;
      return;
    }
    payDelay(u, ballMode ? 480 : shotDelay(wk));
    if (ballMode) {
      const m = mouthAt(u, u.face, true);
      launch('ball', m.x, m.y, a, sp, 'player', u);
      projs[projs.length - 1].bt = ballType;
      campaign[BALLS[ballType].key]--; ballMode = false; Sfx.ballThrow();
      if (!teams[turnTeam].ai) { lastBall = true; lastBallType = ballType; }
    } else {
      const { x: mx, y: my } = mouthAt(u, u.face, false);
      launch(wk, mx, my, a, sp, 'unit', u);
      u.breath = 18; Sfx.shoot(WEAPONS[wk].style);
      muzzle(mx, my, WEAPONS[wk].style, a);
      if (spOf(u).camuflagem) { u.invis = 3; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 30, t: 0, text: 'Camuflado!', col: '#a8e07a', size: 13 }); }
    }
    Sfx.chargeStop();
    lastAngles[kind + turnTeam] = elevOf(u);
    power = 0; charging = false; state = 'flying'; ai = null;
  }

  // ---------- Efeitos do tiro ----------
  const STYLE_COL = { rock: '#c8b898', fire: '#ffb020', leaf: '#7be07b', water: '#9fe0ff', thunder: '#fff27a', normal: '#fff6c8', gust: '#ffffff', web: '#ffffff', dragon: '#9a6aff', poison: '#c783e4', ice: '#bfeaf6', ghost: '#9a7ac8', punch: '#fff0c8', psy: '#ff8ad0', sound: '#bfe9ff', powder: '#e8d8ff', bone: '#fff6e0', crumb: '#f0d090', dung: '#9a7048', egg: '#fff6e0', roach: '#c8a07a', spike: '#f6e6b0', tongue: '#ff8aa0', poop: '#e8e4dc', bee: '#ffd34d' };

  function muzzle(x, y, style, a) {
    const col = STYLE_COL[style] || '#fff';
    fx.push({ x, y, t: 0, max: 16, r: 20, fill: FX_FILL[style], style });
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
      case 'ice':
        if (e) addPart({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-0.3, 0.3), vy: rnd(-0.1, 0.4), g: 0.03, life: 28, max: 28, r: rnd(1.2, 2.4), col: pick(['#ffffff', '#bfeaf6', '#8fd8f0']), kind: 'spark' });
        break;
      case 'ghost':
        if (e) addPart({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-0.3, 0.3), vy: rnd(-0.5, 0.1), g: -0.01, life: 30, max: 30, r: rnd(2, 3.6), col: pick(['#6a4a9a', '#8a6ac0', '#3c2866']), kind: 'smoke' });
        break;
      case 'psy':
        if (e) addPart({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: 0, vy: 0, g: 0, life: 20, max: 20, r: rnd(1.4, 2.6), col: pick(['#ff8ad0', '#b78aff', '#ffffff']), kind: 'spark' });
        break;
      case 'sound':
        break;
      case 'powder':
        if (e) addPart({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-0.3, 0.3), vy: rnd(0, 0.5), g: 0.01, life: 36, max: 36, r: rnd(1.2, 2.4), col: pick(['#e8d8ff', '#c8b0ff', '#fff']), kind: 'drop' });
        break;
      case 'punch':
        if (frameNo % 3 === 0) addPart({ x, y, vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4), g: 0, life: 16, max: 16, r: rnd(1.4, 2.2), col: '#ffe9b0', kind: 'ember' });
        break;
      case 'poison':
        if (e) addPart({ x, y, vx: rnd(-0.35, 0.35), vy: rnd(-0.5, 0.1), g: -0.01, life: 24, max: 24, r: rnd(1.3, 2.6), col: pick(['#a040a0', '#c783e4', '#e5b4ef']), kind: 'drop' });
        break;
    }
  }

  function stepProjs() {
    stepBolts(); stepBeams();
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i], isBall = p.wk === 'ball', isNet = p.wk === 'rede';
      if (p.under) {                                          // Ataque Subterrâneo: corre por baixo da terra
        const U = p.under, myTeam = p.ownerUnit ? p.ownerUnit.team : -1; let pop = false;
        for (let s = 0; s < 3 && !pop; s++) {
          p.x += U.dir * 1.5; U.left -= 1.5;
          if (p.x < 2 || p.x > W - 2 || !solid(p.x, p.y) || U.left <= 0) pop = true;
          else if (units.some(v => v.alive && !v.hidden && v.team !== myTeam && v.team !== 2 && Math.abs(v.x - p.x) < 7 && v.y <= p.y + 2 && v.y > p.y - 140)) pop = true;
        }
        if (frameNo % 3 === 0) { const sy = surfAbove(p.x, p.y); addPart({ x: p.x + rnd(-4, 4), y: sy, vx: rnd(-0.6, 0.6), vy: rnd(-1.6, -0.4), g: 0.12, life: 22, max: 22, r: rnd(1.4, 2.6), col: '#8a6a48', kind: 'ember' }); }
        cam.shake = Math.max(cam.shake, 1.2);
        if (!pop) continue;
        projs.splice(i, 1);
        const sy = solid(p.x, p.y) ? surfAbove(p.x, p.y) : p.y;
        spray(p.x, sy, 16, '#8a6a48', 3.4, 0.16, 34, 2.6, 'chunk');
        explode(p.x, sy - 4, p);
        continue;
      }
      trailFx(p);
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 14) p.trail.shift();
      let outcome = null, target = null;
      for (let s = 0; s < 3 && !outcome; s++) {
        const wm = p.wp.windMul === undefined ? 1 : p.wp.windMul;
        p.vx += wind * 0.0012 * wm;
        p.vy += GRAV * p.wp.grav / 3 + windY * 0.0012 * wm;
        if (p.wp.homing && p.age > 14) {
          const f = homingTarget(p);
          if (f) { const c = centerOf(f), ang = Math.atan2(c.y - p.y, c.x - p.x), sp = Math.hypot(p.vx, p.vy), ca = Math.atan2(p.vy, p.vx); let d = ang - ca; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const na = ca + clamp(d, -p.wp.homing / 3, p.wp.homing / 3); p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp; }
        }
        p.x += p.vx / 3; p.y += p.vy / 3; p.age++;
        if (p.wp.split && !p.sp && p.vy > 0 && p.age > 10) { splitProj(p); outcome = 'gone'; break; }
        if (p.x < -60 || p.x > W + 60 || p.y > H + 60) { outcome = 'gone'; break; }
        if (p.y >= WATER && p.wp.style !== 'water') {
          outcome = 'gone'; Sfx.splash();
          for (let k = 0; k < 10; k++) addPart({ x: p.x, y: WATER, vx: rnd(-1.5, 1.5), vy: rnd(-3, -1), g: 0.15, life: 40, max: 40, r: rnd(1.2, 2.2), col: '#bfe9ff', kind: 'drop' });
          break;
        }
        if (isNet) {
          const e = eggs.find(e => Math.hypot(e.x - p.x, e.y - 9 - p.y) < 16);
          if (e) { target = e; outcome = 'egg'; break; }
        }
        for (const u of units) {
          if (!u.alive || u.hidden || isNet) continue;
          if (u === p.ownerUnit && p.age < 40) continue;
          if (isBall && u.team === 0) continue;                       // a bola atravessa os seus parceiros
          const c = centerOf(u);
          if (Math.hypot(c.x - p.x, c.y - p.y) < hitRof(u)) { target = u; break; }
        }
        if (target) { outcome = 'unit'; break; }
        if (p.wp.burrow && solid(p.x, p.y)) {                 // entra na terra e segue por baixo
          p.under = { dir: Math.sign(p.vx) || (p.ownerUnit ? p.ownerUnit.face : 1), left: p.wp.burrow };
          p.y += 14; p.vx = 0; p.vy = 0; p.trail.length = 0;
          spray(p.x, p.y - 14, 10, '#8a6a48', 2.6, 0.15, 28, 2.2, 'chunk'); Sfx.boom('rock');
          break;
        }
        if (p.wp.dig && p.dug && !solid(p.x, p.y)) { outcome = 'ground'; break; }   // saiu do outro lado: explode na saída
        if (p.wp.dig && solid(p.x, p.y)) {                     // Cavar: abre um túnel e explode lá dentro
          p.dug = (p.dug || 0) + 1;
          if (p.dug % 2 === 0) { const r = p.wp.digR || 11, sp = Math.hypot(p.vx, p.vy) || 1; carve(p.x - p.vx / sp * (r + 2), p.y - p.vy / sp * (r + 2), r, false); if (p.dug % 6 === 0) addPart({ x: p.x, y: p.y, vx: rnd(-1, 1), vy: rnd(-2, 0), g: 0.15, life: 26, max: 26, r: rnd(1.4, 2.6), col: '#8a6a48', kind: 'ember' }); }
          p.vx *= 0.996; p.vy = p.vy * 0.996 - GRAV * p.wp.grav / 3 * 0.6;   // debaixo da terra a broca cai menos
          if (p.dug >= p.wp.dig) { outcome = 'ground'; break; }
          continue;
        }
        if (p.wp.phase ? (solid(p.x, p.y) && solid(p.x, p.y - 26)) : solid(p.x, p.y)) {
          if (p.bn > 0) { bounceProj(p); continue; }
          outcome = 'ground'; break;
        }
      }
      if (!outcome) continue;
      projs.splice(i, 1);
      if (p.wp.teleport) { teleportTo(p, outcome, target); continue; }
      if (outcome === 'gone') continue;
      if (isNet) {
        if (outcome === 'egg') netCatch(p, target);
        else { spray(p.x, p.y - 3, 8, '#e8f4ff', 1.6, 0.1, 26, 1.4, 'spark'); showMsg('A rede errou o ovo...', 70); focus = { x: p.x, y: p.y }; }
        continue;
      }
      if (isBall) { ballResolve(p, target, outcome); continue; }
      explode(p.x, Math.min(p.y, H), p);
    }
    if (!projs.length && !bolts.length && !beams.length && state === 'flying') { state = 'settle'; camHold = 60; camWide = false; }
  }

  function homingTarget(p) {
    let best = null, bd = 1e9;
    const myTeam = p.ownerUnit ? p.ownerUnit.team : -1;
    for (const v of units) {
      if (!v.alive || v.hidden || v.team === myTeam || v.team === 2) continue;
      const d = Math.abs(v.x - p.x) + Math.abs(v.y - p.y); if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  // abre em vários fragmentos quando começa a cair (Avalanche, Sementes...)
  function splitProj(p) {
    const sp = p.wp.split, wp2 = WEAPONS[sp.wk];
    p.sp = true;
    for (let i = 0; i < sp.n; i++) {
      const off = (i - (sp.n - 1) / 2);
      projs.push({ wk: sp.wk, wp: wp2, owner: p.owner, ownerUnit: p.ownerUnit, x: p.x + off * 9, y: p.y - 4, vx: p.vx * 0.85 + off * 0.5, vy: 0.4 + Math.abs(off) * 0.05, trail: [], spin: rnd(0, 6), age: 20, bn: 0, crit: false, sp: true });
    }
    spray(p.x, p.y, 8, '#d8c8b0', 2.2, 0.1, 24, 2, 'chunk'); Sfx.boom('gust');
  }
  // quica no chão: perde força, levanta poeira e causa um impacto menor
  function bounceProj(p) {
    p.bn--; p.y = surf(p.x, p.y - 24) - 2;
    p.vy = -Math.abs(p.vy) * 0.62; p.vx *= 0.82;
    carve(p.x, p.y + 4, 8); cam.shake = Math.max(cam.shake, 3);
    spray(p.x, p.y, 8, '#8c8f94', 2.6, 0.17, 30, 2.4, 'chunk'); Sfx.boom('rock');
    for (const u of units) {
      if (!u.alive || u.hidden || (u === p.ownerUnit && p.age < 40)) continue;
      const c = centerOf(u); if (Math.hypot(c.x - p.x, c.y - p.y) < 22) { const d = shieldDmg(u, Math.round(p.wp.dmg * 0.35 * typeMult(p.wp.type, spOf(u).types))); u.hp -= d; u.hurt = 18; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + d, col: sideColor(u) }); }
    }
    p.trail.length = 0;
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
        campaign.roster.push(u.sp); campaign.xp.push(0); campaign.mv.push(u.mvs); campaign.sh.push(u.sh ? 1 : 0); stageCaught.push({ sp: u.sp, mvs: u.mvs, sh: !!u.sh });
        if (u.sh) { Sfx.shiny(); floaters.push({ x: u.x, y: u.y - 70, t: 0, text: '✨ SHINY capturado!', col: '#ffe27a', size: 18 }); }
        if (u === guest) { guest = null; gCool = 1 + Math.floor(Math.random() * 3); units = units.filter(v => v !== u); }
      }
      state = 'settle'; camHold = 60; camWide = false;
    });
    if (cap) cap.col = BALLS[p.bt || 'ball'].col;
  }

  // ---------- Pokémon no terreno: gravidade, degraus, inclinação ----------
  // u.y = linha dos pés (primeira linha de chão debaixo dele)
  const onGround = u => solid(u.x - 5, u.y) || solid(u.x, u.y) || solid(u.x + 5, u.y);
  // aonde o Pokémon chega dando um passo para nx (sobe degraus de até 8 px); null = parede ou teto de túnel
  function stepTo(u, nx) {
    if (nx < 6 || nx > W - 6) return null;
    let ny = Math.floor(u.y), k = 0;
    while (solid(nx, ny - 1) && k < 9) { ny--; k++; }
    if (solid(nx, ny - 1)) return null;
    const head = Math.max(12, spOf(u).h * u.scale * 0.55);
    for (let hy = 4; hy <= head; hy += 4) if (solid(nx, ny - hy)) return null;
    return ny;
  }
  // logo à frente acaba a ilha? (a IA e os visitantes não se jogam; o jogador pode)
  const ledgeAhead = (u, dir) => surf(u.x + dir * 14, u.y - 10) > u.y + 40;

  // caiu na água: afoga na hora (não dá para atirar depois de cair); se era a vez dele, a vez acaba
  function drownNow(u) {
    if (!u.alive || scene !== 'battle') return;
    u.alive = false; u.hp = 0;
    for (let k = 0; k < 16; k++) addPart({ x: u.x, y: WATER, vx: rnd(-2, 2), vy: rnd(-4, -1.5), g: 0.15, life: 45, max: 45, r: rnd(1.5, 2.5), col: '#bfe9ff', kind: 'drop' });
    Sfx.splash(); Sfx.death();
    showMsg(`${u.name} afogou!`, 100);
    if (u === activeUnit() && (state === 'aim' || state === 'ai')) { charging = false; power = 0; Sfx.chargeStop(); ai = null; state = 'settle'; }
  }
  function updateUnits() {
    for (const u of units) {
      if (!u.alive || (scene === 'intro')) continue;
      if (u.flying && u.alt > 0) {                                   // voadores pairam no ar
        const g = Math.min(gy(u.x), WATER - 30);
        const ty = Math.max(46, g - u.alt) + Math.sin(aF() * 0.05 + u.blinkOff) * 3;
        u.y += (ty - u.y) * 0.1; u.air = false; u.tilt = 0;
        continue;
      }
      if (u.y > WATER) { u.air = false; u.vy = 0; drownNow(u); continue; }       // caiu na água: afoga na hora
      for (let k = 0; k < 14 && solid(u.x, u.y - 1); k++) u.y--;    // chão erguido embaixo dele: sobe junto
      if (onGround(u)) { u.vy = 0; u.air = false; }
      else {
        u.air = true; u.vy = Math.min(8, (u.vy || 0) + 0.32);
        const n = Math.ceil(u.vy);
        for (let i = 0; i < n; i++) { u.y += u.vy / n; if (onGround(u)) { u.y = Math.floor(u.y); u.vy = 0; u.air = false; break; } }
        if (u.y > WATER) { u.y = WATER + 2; u.air = false; drownNow(u); continue; }
      }
      // o corpo inclina com o chão (a mira é relativa ao corpo)
      let t = 0;
      if (!u.air) {
        const s1 = surf(u.x - 9, u.y - 14), s2 = surf(u.x + 9, u.y - 14);
        if (s1 < u.y + 24 && s2 < u.y + 24) t = clamp(Math.atan2(s2 - s1, 18), -0.42, 0.42);
      }
      u.tilt = (u.tilt || 0) + (t - (u.tilt || 0)) * 0.2;
    }
    for (let i = graves.length - 1; i >= 0; i--) {
      const g = graves[i];
      if (!solid(g.x, g.y)) g.y += 2.5;
      if (g.y > WATER) graves.splice(i, 1);
    }
  }

  function walkUnit(u, dir) {
    if (!u || walkBudget <= 0 || u.air) return false;
    const nx = u.x + dir * 1.2, ny = stepTo(u, nx);
    if (ny === null) return false;
    u.x = nx; u.y = ny; u.moving = true; u.walkT++;
    if (u.walkT % 10 === 0) Sfx.step();
    walkBudget -= 1.2;
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

  let dotDone = false;
  function startTurn() {
    dotDone = false; panX = null;
    // ordem por atraso: joga o Pokémon (de qualquer lado) com menos atraso acumulado
    const order = turnOrder();
    if (!order.length) return;
    const u = order[0];
    turnTeam = u.team;
    const t = teams[turnTeam]; t.cur = t.units.indexOf(u);
    for (const v of units) v.stuck = false;
    if (u.shield > 0 && --u.shield === 0) floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 30, t: 0, text: 'Barreira acabou', col: '#bff3ff', size: 12 });
    ai = null; charging = false; power = 0; ballMode = false; netMode = false;
    if (ORIG && stageEggs.length) hatchCarried();
    if (u.puffed) { u.puffed = false; u.hrMul = 1; }
    for (const v of units) if (v.invis > 0) v.invis--;
    // vento muda a cada turno, em qualquer direção (força máxima depende da fase)
    const wmax = kind === 'campaign' ? STAGES[stageIdx].wind : 3;
    windA = rnd(0, Math.PI * 2); windS = Math.random() < 0.15 ? rnd(0, wmax * 0.2) : rnd(wmax * 0.15, wmax * 1.15);
    wind = Math.cos(windA) * windS; windY = -Math.sin(windA) * windS;
    walkBudget = walkMax(); turnT = TURN_TIME;
    // preso na teia, congelado, dormindo ou paralisado: perde esta vez (com atraso menor)
    if (u.webbed) {
      u.webbed = false; u.stuck = true; u.delay += 300;
      const why = { freeze: 'congelado', sleep: 'dormindo', para: 'paralisado' }[u.status] || 'preso na teia';
      state = 'skip'; skipT = 90; walkBudget = 0;
      showMsg(`${u.name}${t.ai ? ' selvagem' : ''} está ${why}: perde a vez!`, 90);
      Sfx.weakEff(); syncButtons();
      return;
    }
    const mem = lastAngles[kind + turnTeam];        // mantém o último ângulo usado
    if (t.ai) {
      state = 'ai'; ai = { phase: 'think0', t: 0 };
      angle = fromElev(u, mem !== undefined ? mem : 45); clampAim(u);
      showMsg(`${u.name} selvagem ataca!`, 90);
    } else {
      state = 'aim';
      angle = fromElev(u, mem !== undefined ? mem : 45); clampAim(u);
      const again = autoBall();
      showMsg(kind === 'campaign' ? `Sua vez: ${u.name}!${again ? ` ${BALLS[ballType].name} pronta (como no último tiro)` : ''}` : `Vez de ${t.name}!`, again ? 150 : 110);
    }
    Sfx.turn(); syncButtons();
  }

  // versão original: última chance de pegar o ovo do último selvagem com a rede
  function netTurn() {
    dotDone = false; panX = null;
    const t = teams[0], u = t.units.find(v => v.alive && !v.hidden && !v.baby) || t.units.find(v => v.alive && !v.hidden);
    if (!u) { stageClear(); return; }
    turnTeam = 0; t.cur = t.units.indexOf(u);
    ai = null; charging = false; power = 0; ballMode = false; netMode = true;
    wind = 0; windY = 0; windS = 0; walkBudget = walkMax(); turnT = TURN_TIME;
    state = 'aim'; angle = fromElev(u, 45); clampAim(u);
    showMsg('Última chance: lance a rede no ovo!', 150);
    Sfx.turn(); syncButtons();
  }
  // passa a vez sem atirar (tecla P, ou quando o tempo acaba)
  function passTurn() {
    if (scene !== 'battle' || state !== 'aim' || teams[turnTeam].ai) return;
    const u = activeUnit(); if (!u) return;
    Sfx.chargeStop(); charging = false; power = 0; ballMode = false;
    payDelay(u, 420); state = 'settle';
    showMsg(turnT <= 0 ? 'Tempo esgotado!' : `${u.name} passou a vez`, 70);
  }

  // alterna entre os golpes do Pokémon da vez (quando ele tem dois)
  function cycleMove() {
    if (scene !== 'battle' || state !== 'aim' || charging) return;
    const u = activeUnit(); if (!u || u.moves.length < 2) return;
    ballMode = false;
    u.mi = (u.mi + 1) % u.moves.length; Sfx.select();
    showMsg(`${WEAPONS[curW(u)].label}!`, 70);
  }

  function switchUnit() {
    return;     // a ordem agora é por atraso: não dá para trocar quem joga
    if (scene !== 'battle' || state !== 'aim' || charging) return;
    const t = teams[turnTeam];
    const j = nextFree(t, t.cur);
    if (j !== t.cur) { t.cur = j; Sfx.click(); syncButtons(); }
  }

  function settle() {
    if (projs.length) return;
    if (units.some(u => u.alive && !u.hidden && !(u.flying && u.alt > 0) && u.air)) return;   // ainda caindo
    if (!dotDone) { dotDone = true; if (!lastShotGuest) { applyDots(activeUnit()); if (guest && guest.alive && guest.dot && roundTurns === 0) applyDots(guest); } }
    for (const u of units) {
      if (!u.alive) continue;
      const drowned = u.y > WATER - 6;
      if (u.hp <= 0 && !drowned && spOf(u).tenaz && !u.tenazUsed) {          // barata: sobrevive uma vez com 1 de vida
        u.hp = 1; u.tenazUsed = true; u.hop = 1;
        floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 26, t: 0, text: 'Sobreviveu! (1 PV)', col: '#ffe27a', size: 14 });
        continue;
      }
      if (u.hp <= 0 || drowned) {
        u.alive = false; u.hp = 0;
        if (drowned) {
          for (let k = 0; k < 16; k++) addPart({ x: u.x, y: WATER, vx: rnd(-2, 2), vy: rnd(-4, -1.5), g: 0.15, life: 45, max: 45, r: rnd(1.5, 2.5), col: '#bfe9ff', kind: 'drop' });
          Sfx.splash();
        } else { smoke(u.x, u.y - 14, 8); spray(u.x, u.y - 14, 10, '#ffffff', 2.5, 0.02, 30, 2, 'spark'); if (ORIG && u.team >= 1 && scene === 'battle') dropEgg(u); }
        Sfx.death();
        showMsg(`${u.name} ${drowned ? 'afogou!' : 'desmaiou!'}`, 100);
      }
    }
    teams.forEach(fixCur);
    if (guest && !guest.alive) { guest = null; gCool = 1 + Math.floor(Math.random() * 3); }
    units = units.filter(u => u.team !== 2 || u.alive);

    {
      if (!teamAlive(teams[1])) {
        if (ORIG && eggs.length && !lastNet && teamAlive(teams[0])) { lastNet = true; netTurn(); return; }   // ovo do último selvagem: uma vez só para a rede
        stageClear(); return;
      }
      if (!teamAlive(teams[0])) { stageLose(); return; }
      if (lastShotGuest) { lastShotGuest = false; startTurn(); return; }
      // uma rodada = todos já jogaram uma vez (em média): o visitante pode aparecer, atacar ou sumir
      if (++roundTurns >= units.filter(v => v.alive && v.team !== 2).length) { roundTurns = 0; if (roundEnd()) return; }
      startTurn();
      return;
    }
  }

  // ---------- Visitantes neutros (atacam qualquer lado, podem ser capturados) ----------
  function roundEnd() {
    maybeChangeWeather();
    const defs = STAGES[stageIdx].guests || [];
    if (guest && guest.alive) {
      const g = guest; gT = 0;
      if (g.turnsLeft <= 0) {
        gMode = 'leave'; state = 'guest';
        showMsg(`${g.name} foi embora...`, 80); Sfx.weakEff();
        return true;
      }
      g.turnsLeft--;
      if (g.webbed || g.status === 'freeze' || g.status === 'sleep' || g.status === 'para') {
        const why = g.webbed ? 'na teia' : { freeze: 'congelado', sleep: 'dormindo', para: 'paralisado' }[g.status];
        g.webbed = false; g.status = null; g.stuck = true; gMode = 'stuck'; state = 'guest';
        showMsg(`${g.name} está ${why}!`, 70); Sfx.weakEff();
        return true;
      }
      // o visitante se mexe antes de atacar (anda, ou voa)
      const tgt = guestTarget(g);
      if (tgt && Math.random() < 0.8) {
        const dir = Math.sign(tgt.x - g.x) || 1, dist = Math.abs(tgt.x - g.x);
        g.gDest = clamp(g.x + dir * Math.min(rnd(70, 190), Math.max(0, dist - 120)) * (Math.random() < 0.2 ? -1 : 1), 30, W - 30);
        g.face = dir; gMode = 'move'; state = 'guest'; g.gTarget = tgt;
        if (g.flying) g.alt = rnd(60, 160);
        showMsg(`${g.name} ${g.flying ? 'voa' : 'se aproxima'}...`, 70);
        return true;
      }
      guestWarn(g, tgt);
      return true;
    }
    if (!defs.length) return false;
    if (gCool > 0) { gCool--; return false; }
    // sorteio por raridade: quanto menor o número, mais difícil de aparecer
    const def = defs.slice().sort(() => Math.random() - 0.5).find(d => Math.random() < d.rarity);
    if (!def) return false;
    let x = 400, tries = 0;
    do { x = rnd(50, W - 50); tries++; } while (tries < 60 && (gy(x) > WATER - 40 || units.some(v => v.alive && Math.abs(v.x - x) < 46)));
    if (gy(x) > WATER - 40) return false;
    const g = mkUnit(def.sp, x, 2, Math.random() < 0.5 ? 1 : -1, 1, MS.rollMoves(def.sp, wildBonus(stageIdx) + 0.05));
    g.capScale = 0; g.sh = rollShiny();
    if (SPECIES[def.sp].fly) { g.flying = true; g.alt = rnd(70, 160); g.y = Math.max(46, gy(x) - g.alt); }
    g.turnsLeft = Number.isInteger(def.stayRounds) && def.stayRounds > 0
      ? def.stayRounds : 2 + (def.rarity >= 0.2 ? 1 : 0) + Math.floor(Math.random() * 2);
    guest = g; units.push(g); gMode = 'appear'; gT = 0; state = 'guest';
    showMsg(`${g.sh ? '✨ ' : ''}${g.name}${isVar(g) ? ' ' + stars(g.mvs) : ''}${g.sh ? ' SHINY' : ''} selvagem apareceu${g.flying ? ' no ar' : ''}!`, 110); Sfx.ballCatch();
    if (g.sh) Sfx.shiny();
    spray(x, g.y - 14, 14, g.sh ? '#ffffff' : '#fff27a', 3.2, 0.02, 40, 2, 'spark');
    return true;
  }

  // alvo do visitante: um dos dois Pokémon mais próximos (de qualquer lado)
  function guestTarget(g) {
    const c = units.filter(v => v.alive && !v.hidden && v.team !== 2).sort((a, b) => Math.abs(a.x - g.x) - Math.abs(b.x - g.x));
    return c.length ? (Math.random() < 0.7 ? c[0] : c[Math.min(1, c.length - 1)]) : null;
  }
  // anuncia o ataque e calcula a mira (com erro) para o visitante acertar perto do alvo
  function guestWarn(g, tgt) {
    gT = 0;
    if (!tgt) tgt = guestTarget(g);
    gSide = tgt ? (Math.sign(tgt.x - g.x) || (Math.random() < 0.5 ? -1 : 1)) : (Math.random() < 0.5 ? -1 : 1);
    g.face = gSide; g.gAim = null;
    if (tgt) {
      g.mi = Math.floor(Math.random() * g.moves.length);
      const wp = WEAPONS[curW(g)];
      if (!wp.none) {
        const S = spOf(g), tc = centerOf(tgt), tg = shotTargets(wp, g);
        let best = null, bd = 1e9;
        for (let deg = 18; deg <= 80; deg += 3) {
          const a = (gSide > 0 ? deg : 180 - deg) * Math.PI / 180;
          const x0 = g.x + gSide * S.mouth[0] * g.scale, y0 = g.y + S.mouth[1] * g.scale;
          for (let pw = 22; pw <= 100; pw += 5) {
            const r = simShot(wp, g, x0, y0, a, 3 + pw * 0.075, tg);
            if (!r) continue;
            const d = Math.hypot(r.x - tc.x, r.y - tc.y);
            if (d < bd) { bd = d; best = { deg, pw }; }
          }
        }
        if (best) g.gAim = { deg: best.deg + rnd(-7, 7), pw: clamp(best.pw + rnd(-9, 9), 15, 100) };
      }
    }
    gMode = 'warn'; gDelay = 100; state = 'guest';
    showMsg(`${g.name} vai atacar a ${gSide < 0 ? 'ESQUERDA' : 'DIREITA'}!`, 100); Sfx.voltWarn();
  }

  function guestShoot() {
    const g = guest, S = spOf(g);
    if (g && !g.gAim) g.mi = Math.floor(Math.random() * g.moves.length);
    const wk = g ? curW(g) : null, wp = g ? WEAPONS[wk] : null;
    if (!g || wp.none) { lastShotGuest = true; state = 'settle'; return; }
    const aim = g.gAim, deg = aim ? aim.deg : rnd(35, 72), a = (gSide > 0 ? deg : 180 - deg) * Math.PI / 180;
    const mx = g.x + gSide * S.mouth[0] * g.scale, my = g.y + S.mouth[1] * g.scale;
    launch(wk, mx, my, a, aim ? 3 + aim.pw * 0.075 : rnd(5.2, 8.4), 'guest', g);
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
    } else if (gMode === 'move') {
      const dx = g.gDest - g.x, sp = g.flying ? 1.7 : 1.3;
      if (Math.abs(dx) <= sp || gT > 240) { g.moving = false; guestWarn(g, g.gTarget); return; }
      const dir = Math.sign(dx), nx = g.x + dir * sp;
      const ny = g.flying ? g.y : stepTo(g, nx);
      let blocked = !g.flying && (ny === null || ledgeAhead(g, dir));
      if (blocked) { g.moving = false; guestWarn(g, g.gTarget); return; }
      g.x = nx; if (!g.flying) g.y = ny; g.face = dir; g.moving = !g.flying; g.walkT++;
      if (!g.flying && g.walkT % 10 === 0) Sfx.step();
    } else if (gMode === 'warn') {
      g.moving = false; g.face = gSide;
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
  // alvos possíveis de um tiro (calculados uma vez por planejamento, para a IA não travar)
  function shotTargets(wp, shooter) {
    const out = [];
    for (const v of units) {
      if (!v.alive || v.hidden || v === shooter || (wp.style === 'ball' && v.team === 0)) continue;
      const c = centerOf(v), r = hitRof(v); out.push({ x: c.x, y: c.y, r2: r * r });
    }
    return out;
  }
  function simShot(wp, shooter, x0, y0, a, sp, tg) {
    tg = tg || shotTargets(wp, shooter);
    let x = x0, y = y0, vx = sp * wp.speed * Math.cos(a), vy = -sp * wp.speed * Math.sin(a);
    const gk = GRAV * wp.grav / 3, wm = wp.windMul === undefined ? 1 : wp.windMul;
    let dug = 0;
    for (let n = 0; n < 700; n++) {
      for (let s = 0; s < 3; s++) {
        vx += wind * 0.0012 * wm; vy += gk + windY * 0.0012 * wm; x += vx / 3; y += vy / 3;
        if (x < -60 || x > W + 60 || y > H + 60 || y >= WATER) return null;
        if (wp.dig) { if (solid(x, y)) { vy -= gk * 0.6; if (++dug >= wp.dig) return { x, y }; } else if (dug) return { x, y }; }
        else if (wp.phase ? (solid(x, y) && solid(x, y - 26)) : solid(x, y)) return { x, y };
        for (let k = 0; k < tg.length; k++) {
          const dx = tg[k].x - x, dy = tg[k].y - y;
          if (dx * dx + dy * dy < tg[k].r2) return { x, y };
        }
      }
    }
    return null;
  }

  function scoreHit(wp, shooter, lx, ly) {
    let sc = 0;
    for (const v of units) {
      if (!v.alive || v.hidden || (v.invis > 0 && v.team !== shooter.team)) continue;
      const c = centerOf(v), d = Math.hypot(c.x - lx, c.y - ly);
      if (d >= wp.boom) continue;
      const dmg = wp.dmg * (1 - d / wp.boom) * typeMult(wp.type, spOf(v).types) * wxMul(wp.type);
      if (v.team === 2) continue;                                   // visitante neutro: a IA ignora
      if (v.team === shooter.team) sc -= dmg * 1.3;
      else sc += dmg + (dmg >= v.hp ? 30 : 0);
    }
    return sc;
  }

  // simula todos os ângulos/forças para um golpe e devolve o melhor palpite
  // a IA testa ângulos e forças; como gerador, pausa entre ângulos para o jogo não travar (stepAI pensa ~6 ms por quadro)
  function* planWeaponGen(u, wk) {
    const S = spOf(u), wp = WEAPONS[wk];
    const foes = units.filter(v => v.alive && !v.hidden && v.team !== u.team && v.team !== 2 && !(v.invis > 0));
    let best = null, bestS = -1e9, near = null, nearD = 1e9;
    const tg = shotTargets(wp, u);
    const heavy = wp.count >= 3 || u.moves.length > 1, aStep = (heavy ? 4 : 3) + (lite ? 2 : 0), pStep = (heavy ? 6 : 5) + (lite ? 3 : 0);
    // só os ângulos que a espécie consegue escolher, olhando para os dois lados
    const cands = [];
    for (const face of [1, -1]) { const [lo, hi] = aimWindow(u, face); for (let e = Math.max(-30, lo); e <= Math.min(180, hi) + 0.01; e += aStep) cands.push([face > 0 ? e : 180 - e, face]); }
    for (const [ang, face] of cands) {
      const a = ang * Math.PI / 180;
      const { x: x0, y: y0 } = mouthAt(u, face, false);
      for (let pw = 18; pw <= 100; pw += pStep) {
        const sp = 3 + pw * 0.075;
        let score = 0, dmin = 1e9;
        for (let i = 0; i < wp.count; i++) {
          const off = wp.count === 1 ? 0 : (i - (wp.count - 1) / 2) * wp.spread * Math.PI / 180;
          const r = simShot(wp, u, x0, y0, a + off, sp, tg);
          if (!r) continue;
          score += scoreHit(wp, u, r.x, r.y);
          for (const f of foes) dmin = Math.min(dmin, Math.hypot(r.x - f.x, r.y - f.y));
        }
        score += Math.random() * 0.5;
        if (score > bestS) { bestS = score; best = { ang, pw, face }; }
        if (dmin < nearD) { nearD = dmin; near = { ang, pw, face }; }
      }
      yield;
    }
    return { pick: bestS > 1 ? best : (near || { ang: fromElev(u, 45), pw: 60, face: u.face }), score: bestS > 1 ? bestS : 0, near: nearD };
  }

  function* planShotGen(u) {
    // com dois golpes, a IA simula os dois e usa o que promete mais dano
    let bestPlan = null, bestMi = 0;
    for (let i = 0; i < u.moves.length; i++) {
      const wk = u.moves[i];
      if (WEAPONS[wk].none || WEAPONS[wk].teleport || WEAPONS[wk].protect) continue;
      const pl = yield* planWeaponGen(u, wk);
      if (!bestPlan || pl.score > bestPlan.score || (pl.score === bestPlan.score && pl.near < bestPlan.near)) { bestPlan = pl; bestMi = i; }
    }
    return finishPlan(u, bestPlan, bestMi);
  }
  function finishPlan(u, bestPlan, bestMi) {
    u.mi = bestMi;
    const pick1 = bestPlan ? bestPlan.pick : { ang: fromElev(u, 45), pw: 60, face: u.face };
    u.face = pick1.face || u.face;
    const err = STAGES[stageIdx].err;
    const e1 = (Math.random() + Math.random() - 1) * err, e2 = (Math.random() + Math.random() - 1) * err * 0.7;
    { const [lo, hi] = aimWindow(u); ai.angle = fromElev(u, clamp(elevOf(u, pick1.ang) + e1 * u.face, lo, hi)); }
    ai.power = clamp(pick1.pw + e2, 15, 100);
    return bestPlan ? bestPlan.score : 0;
  }
  // ---------- IA em segundo plano (Web Worker) ----------
  // o mesmo cálculo de planWeaponGen, mas numa linha de execução separada: a tela continua a 60 fps enquanto a CPU pensa
  let aiWorker = null, aiWorkerFailed = false, aiJobSeq = 0;
  function getAiWorker() {
    if (aiWorker || aiWorkerFailed) return aiWorker;
    try {
      if (typeof Worker !== 'function' || typeof location === 'undefined' || location.protocol === 'file:') throw 0;
      aiWorker = new Worker('js/ai-worker.js?v=' + GAME_VERSION.replace(/\W/g, ''));
      aiWorker.onerror = () => { aiWorkerFailed = true; aiWorker = null; };
    } catch (_) { aiWorkerFailed = true; aiWorker = null; }
    return aiWorker;
  }
  function aiJob(u) {
    const wkr = getAiWorker(); if (!wkr) return null;
    const job = { done: false, value: 0, want: 0, got: [], id: ++aiJobSeq };
    const list = [];
    u.moves.forEach((wk, i) => { const w = WEAPONS[wk]; if (!(w.none || w.teleport || w.protect)) list.push([wk, i]); });
    if (!list.length) { job.done = true; job.value = finishPlan(u, null, 0); return job; }
    const foes = units.filter(v => v.alive && !v.hidden && v.team !== u.team && v.team !== 2 && !(v.invis > 0)).map(v => ({ x: v.x, y: v.y }));
    const heavyAny = u.moves.length > 1;
    job.want = list.length;
    wkr.onmessage = e => {
      const r = e.data; if (r.id !== job.id || job.done) return;
      const [wk, i] = list[job.got.length];
      job.got.push({ i, pl: { pick: r.bestS > 1 ? r.best : (r.near || { ang: fromElev(u, 45), pw: 60, face: u.face }), score: r.bestS > 1 ? r.bestS : 0, near: r.nearD } });
      void wk;
      if (job.got.length < job.want) return;
      let bestPlan = null, bestMi = 0;
      for (const { i: mi, pl } of job.got) if (!bestPlan || pl.score > bestPlan.score || (pl.score === bestPlan.score && pl.near < bestPlan.near)) { bestPlan = pl; bestMi = mi; }
      job.result = { bestPlan, bestMi }; job.done = true;
    };
    let first = true;
    for (const [wk] of list) {
      const wp = WEAPONS[wk];
      const heavy = wp.count >= 3 || heavyAny, aStep = (heavy ? 4 : 3) + (lite ? 2 : 0), pStep = (heavy ? 6 : 5) + (lite ? 3 : 0);
      const cands = [];
      for (const face of [1, -1]) {
        const [lo, hi] = aimWindow(u, face), m = mouthAt(u, face, false);
        for (let e2 = Math.max(-30, lo); e2 <= Math.min(180, hi) + 0.01; e2 += aStep) cands.push({ ang: face > 0 ? e2 : 180 - e2, face, x0: m.x, y0: m.y });
      }
      const scoreU = units.filter(v => v.alive && !v.hidden && !(v.invis > 0 && v.team !== u.team)).map(v => { const c = centerOf(v); return { x: c.x, y: c.y, team: v.team, hp: v.hp, mul: typeMult(wp.type, spOf(v).types) * wxMul(wp.type) }; });
      const msg = { id: job.id, wp: { speed: wp.speed, grav: wp.grav, windMul: wp.windMul, dig: wp.dig, phase: wp.phase, count: wp.count, spread: wp.spread || 0, boom: wp.boom, dmg: wp.dmg },
        tg: shotTargets(wp, u), cands, scoreU, foes, team: u.team, pStep, wind, windY, GRAV, WATER };
      if (first) { msg.mask = mask.slice().buffer; msg.W = W; msg.H = H; first = false; wkr.postMessage(msg, [msg.mask]); }
      else wkr.postMessage(msg);
    }
    return job;
  }
  // versão de uma vez só (testes)
  function planShot(u) { const g = planShotGen(u); let r; do r = g.next(); while (!r.done); return r.value; }

  function nearestFoe(u) {
    let best = null, bd = 1e9;
    for (const v of units) if (v.alive && !v.hidden && v.team !== u.team && v.team !== 2 && !(v.invis > 0)) { const d = Math.abs(v.x - u.x); if (d < bd) { bd = d; best = v; } }
    return best;
  }

  function stepAI() {
    const u = activeUnit(), a = ai;
    if (!u || !u.alive || !a) { state = 'settle'; return; }
    a.t++;
    if (a.phase === 'think0') {
      if (u.moves.every(k => WEAPONS[k].none)) { a.phase = 'splash'; a.t = 0; showMsg(`${u.name} usou Splash!`, 80); Sfx.splash(); return; }
      const pi = u.moves.findIndex(k => WEAPONS[k].protect);           // machucado e sem barreira: às vezes se protege
      if (pi >= 0 && !(u.shield > 0) && u.hp / u.maxhp < 0.5 && Math.random() < 0.55) { u.mi = pi; fire(); return; }
      const f = nearestFoe(u);
      const far = f ? Math.abs(f.x - u.x) : 0;
      a.walkDir = f ? Math.sign(f.x - u.x) * (far > 430 || Math.random() < 0.7 ? 1 : -1) : -1;
      a.walkLeft = (u.webbed || (far <= 430 && Math.random() < 0.45)) ? 0 : far > 430 ? Math.round(walkMax() * 0.9) : Math.round(rnd(15, 50));
      a.phase = 'walk';
    } else if (a.phase === 'walk') {
      if (a.walkLeft > 0 && walkBudget > 0) {
        if (!ledgeAhead(u, a.walkDir || -1) && walkUnit(u, a.walkDir || -1)) a.walkLeft -= 1.2; else a.walkLeft = 0;
        u.face = a.walkDir >= 0 ? 1 : -1;
      } else a.phase = 'plan';
    } else if (a.phase === 'plan') {
      // pensa em pedaços de ~6 ms por quadro (num aparelho fraco a IA não congela a tela)
      let sc;
      if (!a.gen && !a.job) { a.job = aiJob(u); if (!a.job) a.gen = planShotGen(u); a.jobT = 0; }
      if (a.job) {                                   // segundo plano: só espera a resposta (até 3 s; depois pensa aqui mesmo)
        if (!a.job.done) { if (++a.jobT > 180) { a.job = null; a.gen = planShotGen(u); } return; }
        sc = a.job.result ? finishPlan(u, a.job.result.bestPlan, a.job.result.bestMi) : a.job.value;
        a.job = null;
      } else {
        const t0 = Date.now(); let r;
        do r = a.gen.next(); while (!r.done && Date.now() - t0 < 6);
        if (!r.done) return;
        a.gen = null;
        sc = r.value;
      }
      // nada acerta daqui (faixa de mira estreita, morro no caminho): anda um pouco e tenta de novo
      if (sc <= 1 && (a.tries || 0) < 2 && walkBudget > 30) {
        const f = nearestFoe(u); a.tries = (a.tries || 0) + 1;
        a.walkDir = f ? (Math.sign(f.x - u.x) || 1) * (Math.random() < 0.75 ? 1 : -1) : -u.face;
        a.walkLeft = rnd(30, 70); a.phase = 'walk'; return;
      }
      a.phase = 'aim';
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
      if (a.t > 80) { u.hop = 0; payDelay(u, 400); state = 'settle'; }
    }
  }

  // ---------- Partículas ----------
  function addPart(p) { if (parts.length < (lite ? 90 : 320)) parts.push(p); }

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
      case 'ice':
        spray(x, y, 20, '#dff4ff', 4, 0.1, 50, 2.2, 'spark'); spray(x, y, 8, '#8fd8f0', 3, 0.12, 60, 2.8, 'chunk'); break;
      case 'ghost':
        spray(x, y, 12, '#8a6ac0', 2.8, -0.01, 60, 3.2, 'drop'); smoke(x, y, 6); break;
      case 'psy':
        spray(x, y, 16, '#ff8ad0', 3, 0, 40, 2.2, 'spark'); spray(x, y, 8, '#ffffff', 2.4, 0, 30, 1.6, 'spark'); break;
      case 'sound':
        spray(x, y, 10, '#bfe9ff', 2.6, 0, 36, 2, 'drop'); break;
      case 'powder':
        spray(x, y, 18, '#e8d8ff', 2, -0.01, 70, 2.2, 'drop'); break;
      case 'punch':
        spray(x, y, 14, '#fff0c8', 4.2, 0.06, 30, 2.4, 'spark'); spray(x, y, 8, '#5b3a20', 3, 0.15, 55, 2.4, 'chunk'); smoke(x, y, 3); break;
      case 'poison':
        spray(x, y, 16, '#c783e4', 2.8, 0.02, 44, 2.4, 'drop');
        spray(x, y, 8, '#a040a0', 2.0, -0.01, 50, 1.6, 'ember'); break;
      default:
        spray(x, y, 16, '#fff27a', 4.5, 0, 22, 1.4, 'spark'); spray(x, y, 8, '#5b3a20', 3, 0.15, 60, 2.6, 'chunk'); smoke(x, y, 3);
    }
  }
  function burstDecor(d) {
    const y = d.base - 10;
    if (['rock', 'stalag', 'tomb', 'volrock', 'pillar', 'ember'].includes(d.type)) spray(d.x, y, 8, '#8c8f94', 3, 0.15, 60, 2.6, 'chunk');
    else if (d.type === 'icespike' || d.type === 'snowpine') spray(d.x, y, 10, '#dff4ff', 3, 0.1, 50, 2.2, 'spark');
    else if (d.type === 'pylon') spray(d.x, y, 10, '#fff27a', 3, 0.05, 40, 1.6, 'spark');
    else if (d.type === 'crystal') spray(d.x, y, 10, d.col, 3, 0.1, 50, 2.2, 'spark');
    else spray(d.x, y, 8, d.type === 'flower' ? d.col : '#4f9a3a', 2.2, 0.03, 70, 3, 'leaf');
  }
  function stepParts() {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g; p.vx *= 0.985;
      if (p.kind === 'leaf') { p.vx += Math.sin((frameNo + i) * 0.15) * 0.05; p.vy = Math.min(p.vy, 1.2); }
      p.x += p.vx; p.y += p.vy;
      if (p.g > 0.1 && solid(p.x, p.y)) { p.y -= Math.max(1, p.vy); p.vy *= -0.3; p.vx *= 0.5; }
      if (--p.life <= 0 || p.y > H + 20) parts.splice(i, 1);
    }
  }

  // ---------- Desenho ----------
  const blink = u => ((frameNo + u.blinkOff) % 230) < 7;
  // mania dos monstrinhos originais: de tempos em tempos (parado) faz o seu gesto; devolve o progresso 0..1 ou null
  const maniaOf = u => {
    const S = spOf(u); if (!S.mania || u.moving || u.breath > 0 || u.hurt > 0 || u.capScale < 1 || scene === 'intro') return null;
    const t = (frameNo + u.uid * 97) % 600; return t < 90 ? t / 90 : null;
  };

  // devolve { t: transform do Pokémon, h: conteúdo interno } — a camada só reescreve o conteúdo quando ele muda
  function unitParts(u, opt = {}) {
    const S = spOf(u), sc = u.scale * u.capScale;
    // parado, a animação (respirar, balançar) muda a cada 4 quadros (8 no modo leve): o desenho não é refeito todo quadro
    const af = !u.moving && !u.breath && !u.hurt && !u.hop && !(u.capScale < 1) ? frameNo & (lite ? ~15 : ~7) : frameNo;
    // o balanço vai no transform do grupo (suave e barato); o desenho interno não muda por causa dele
    const bob = 0, bobT = !lite && opt.noShadow === undefined && scene === 'battle' ? Math.sin(frameNo * 0.08 + u.uid * 1.7) * 0.7 : 0;   // no modo leve, parado é parado
    const step = u.moving ? Math.sin(u.walkT * 0.5) * 1.6 : 0;
    const flash = u.hurt > 0 && (u.hurt % 6 < 3);
    const col = opt.color || sideColor(u);
    const hop = u.hop ? -Math.abs(Math.sin(u.hop * 0.18)) * 16 : 0;
    const ctx = { f: af, blink: lite ? false : blink(u), breath: u.breath, bob, step, x: u.x, charge: !!opt.charge, flap: !!u.flying, mania: maniaOf(u), hurt: u.hurt > 0, puffed: !!u.puffed };
    const ly = -(S.h * u.scale + 12);
    let label = '';
    if (!opt.noLabel && u.capScale > 0.5) {
      const hp = clamp(u.hp / u.maxhp, 0, 1);
      label = `<g transform="translate(0 ${f1(ly)})">
        ${opt.extra || ''}
        <text x="0" y="0" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#fff" stroke="#000" stroke-width=".6">${u.sh ? '✨' : ''}${u.name}${isVar(u) ? `<tspan fill="#ffd34d" dx="2">${stars(u.mvs)}</tspan>` : ''}</text>
        ${Art.typeDots(S.types, 0, -12, TYPE_COLOR)}
        ${opt.noBar ? '' : `<rect x="-15" y="3" width="30" height="5.5" rx="2.75" fill="#000" opacity=".6"/>
        <rect x="-14" y="4" width="${f1(28 * hp)}" height="3.5" rx="1.75" fill="${col}"/>`}
        ${(u.webbed || u.stuck) ? `<g transform="translate(21 -2)" stroke="#fff" stroke-width="1" fill="none"><circle r="4.5"/><circle r="2"/><path d="M-5,0H5M0,-5V5M-3.5,-3.5L3.5,3.5M3.5,-3.5L-3.5,3.5" stroke-width=".7"/></g>` : ''}
      </g>`;
    }
    const web = (u.webbed || u.stuck) ? `<g transform="translate(0 ${f1(-S.hitY * u.scale)})" stroke="#fff" stroke-width="1" fill="rgba(255,255,255,.18)" opacity=".9">
      <circle r="${f1(15 * u.scale)}"/><circle r="${f1(8 * u.scale)}"/>
      <path d="M-15,0H15M0,-15V15M-10.6,-10.6L10.6,10.6M10.6,-10.6L-10.6,10.6" stroke-width=".8" transform="scale(${f1(u.scale)})"/></g>` : '';
    const sy = scene === 'intro' ? gy(u.x) : surf(u.x, u.y - 2);
    const shadow = opt.noShadow || sy > WATER ? '' : `<ellipse cx="0" cy="${f1(sy - u.y + 0.5)}" rx="${f1(11 * u.scale)}" ry="${f1(2.6 * u.scale)}" fill="#000" opacity=".25"/>`;
    const tilt = u.tilt && !u.flying ? `rotate(${f1(u.tilt * 57.3)}) ` : '';
    const lift = u.lift || 0;
    const shield = u.shield > 0 && u.capScale > 0.5 ? `<circle cx="0" cy="${f1(-S.hitY * u.scale)}" r="${f1(S.hitR * u.scale * 1.75 + 4)}" fill="#8fe0ff" fill-opacity=".13" stroke="#bff3ff" stroke-width="1.8" stroke-opacity="${(0.55 + 0.3 * Math.sin(af * 0.12)).toFixed(2)}"/>` : '';
    return { t: `translate(${f1(u.x)} ${f1(u.y + hop - lift + bobT)})`, h: `
      ${lift ? `<g transform="translate(0 ${f1(lift)})">${shadow}</g>` : shadow}${shield}
      <g transform="${tilt}scale(${f1(u.face * sc)} ${f1(sc)})"${u.invis > 0 ? ' opacity=".3"' : flash ? ' opacity=".45"' : ''}><g${shF(u.sp, u.sh)}>${Art.draw(u.sp, ctx)}</g></g>
      ${u.sh && u.capScale > 0.5 ? glint(af, -S.hitR * u.scale * 0.8, -S.hitY * u.scale - 6, 1.2, u.blinkOff) + glint(af, S.hitR * u.scale * 0.9, -S.hitY * u.scale + 8, 0.9, u.blinkOff + 2) + glint(af, 0, -S.h * u.scale * 0.8, 1, u.blinkOff + 4) : ''}
      ${spOf(u).escolta && u.capScale > 0.5 && !beesOut(u) && MS.BEE_MINI ? Array.from({ length: spOf(u).escolta }, (_, i) => { const q = escortPos(u, i); return `<g transform="translate(${f1(q.x)} ${f1(q.y)}) scale(${f1(q.dir * 1.25 * u.scale)} ${f1(1.25 * u.scale)})">${MS.BEE_MINI}</g>`; }).join('') : ''}
      ${statusIcon(u)}${web}${label}` };
  }
  const unitSvg = (u, opt) => { const p = unitParts(u, opt); return `<g transform="${p.t}">${p.h}</g>`; };

  // camada com um <g> por item (Pokémon, Pokébolas no chão): mexe só no transform quando o item anda
  // e só reescreve o conteúdo quando o desenho dele muda — o navegador não reinterpreta a camada inteira todo quadro
  const keyedEls = {};
  function renderKeyed(id, items) {
    const box = $(id);
    if (typeof document.createElementNS !== 'function') { box.innerHTML = items.map(it => `<g transform="${it.t}">${it.h}</g>`).join(''); return; }
    const map = keyedEls[id] || (keyedEls[id] = new Map()), seen = new Set();
    let prev = null;
    for (const it of items) {
      let r = map.get(it.k);
      if (!r) { r = { g: document.createElementNS('http://www.w3.org/2000/svg', 'g'), t: null, h: null }; map.set(it.k, r); }
      if (r.t !== it.t) { r.g.setAttribute('transform', it.t); r.t = it.t; }
      if (r.h !== it.h) { r.g.innerHTML = it.h; r.h = it.h; }
      const want = prev ? prev.nextSibling : box.firstChild;
      if (r.g !== want) box.insertBefore(r.g, want);
      prev = r.g; seen.add(it.k);
    }
    for (const [k, r] of map) if (!seen.has(k)) { r.g.remove(); map.delete(k); }
  }

  function statusIcon(u) {
    if (!u.status || u.capScale < 0.5) return '';
    const S = spOf(u), y = -S.h * u.scale * 0.55, b = Math.sin(aF() * 0.15) * 1.5;
    const col = { burn: '#ff7a1a', poison: '#b45ac8', freeze: '#bfeaf6', sleep: '#c8d8ff', para: '#ffe96a' }[u.status] || '#fff';
    const ch = { burn: '🔥', poison: '☠', freeze: '❄', sleep: 'Z', para: '⚡' }[u.status] || '';
    return `<g transform="translate(${f1(-S.hitR * u.scale - 8)} ${f1(y + b)})"><circle r="6.5" fill="#000" opacity=".55" stroke="${col}" stroke-width="1.4"/><text y="3.4" text-anchor="middle" font-size="9" fill="${col}" font-weight="bold">${ch}</text></g>`;
  }

  function renderTerrain() {
    miniTerr = null;
    if (terrDirty) {
      const d = terrainPath();
      $('tclipPath').setAttribute('d', d); $('tback').setAttribute('d', d); $('tedge').setAttribute('d', d); $('tfill').setAttribute('d', d);
      terrDirty = false;
    }
    $('scorch').innerHTML = scorch.map(c => `<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${f1(c.r + 2)}"/>`).join('');
    // grama só no topo original que ainda está de pé; queimado onde a explosão passou
    let g = '', b = '', tf = '', lg = -9, lb = -9;
    for (let x = 0; x < W; x += 2) {
      const y = heights[x]; if (y >= WATER - 2) continue;
      const cont = x >= 2 && Math.abs(y - heights[x - 2]) < 6;
      if (grass[x]) { g += (cont && lg === x - 2 ? ' L' : ' M') + x + ',' + f1(y); lg = x; }
      else { b += (cont && lb === x - 2 ? ' L' : ' M') + x + ',' + f1(y); lb = x; }
    }
    for (let x = 3; x < W; x += 7) {
      const y = heights[x], t = tuft[x];
      if (!grass[x] || y >= WATER - 2 || Math.abs(y - heights[x - 1]) > 4) continue;
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

  function stepClouds() {
    for (const c of clouds) {
      c.x += c.sp + wind * 0.04;
      if (c.x > VW + 110) c.x = -110;
      if (c.x < -110) c.x = VW + 110;
    }
  }
  function renderClouds() {
    clouds.forEach((c, i) => {
      cloudEls[i].setAttribute('transform', `translate(${f1(c.x)} ${f1(c.y)}) scale(${c.s.toFixed(2)})`);
    });
  }

  const ballIcon = (x, y, r) => `<g transform="translate(${x} ${y})">${Art.ball(r, 0)}</g>`;

  // ---------- Clima (desenhado em tela cheia, por cima do mundo) ----------
  function stepWeather() {
    if (wxK < 1) { wxK = Math.min(1, wxK + 0.02); if (wxK >= 1) wxPrev = null; }
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

  // clima: as gotas/flocos são desenhados uma vez (em 3 grupos com velocidades diferentes, duas cópias empilhadas)
  // e a animação só move os grupos — muda um atributo por quadro em vez de reescrever dezenas de elementos
  const WX_SP = { rain: [15, 19, 24], snow: [1.1, 1.6, 2.2] };
  function wxLayer(w, tag) {
    let s = '';
    if (w === 'rain') {
      s += `<rect width="800" height="500" fill="#0a1a33" opacity=".3"/>`;
      if (lite) return s;
      const sl = -wind * 0.1 - 0.12;
      for (let j = 0; j < 3; j++) {
        let g = '';
        for (let i = 0; i < 22; i++) {
          const y0 = ((i * 53 + j * 177) % 540) - 20, x0 = ((i * 131.7 + j * 211) % 880) - 40;
          for (const y of [y0, y0 - 540]) g += `<line x1="${f1(x0 - y * sl)}" y1="${f1(y)}" x2="${f1(x0 - y * sl + sl * 16)}" y2="${f1(y + 16)}"/>`;
        }
        s += `<g id="wx${tag}${j}" stroke="#cfe9ff" stroke-width="${j === 2 ? 1.6 : 1.1}" opacity="${(0.3 + j * 0.08).toFixed(2)}" stroke-linecap="round">${g}</g>`;
      }
    } else if (w === 'sun') {
      s += `<rect width="800" height="500" fill="#ffb347" opacity=".09"/>
        <g transform="translate(690 52)">
          <circle r="190" fill="#fff2b0" opacity=".05"/><circle r="120" fill="#fff2b0" opacity=".07"/><circle r="64" fill="#fff6c8" opacity=".14"/>
          <g id="wx${tag}0">${Array.from({ length: 10 }, (_, i) => `<path transform="rotate(${i * 36})" d="M-5,-70 L0,-260 L5,-70 Z" fill="#fff6c8" opacity=".07"/>`).join('')}</g>
        </g>
        <circle cx="560" cy="150" r="14" fill="#fff6c8" opacity=".07"/><circle cx="470" cy="215" r="22" fill="#ffd9a0" opacity=".06"/><circle cx="390" cy="270" r="10" fill="#fff6c8" opacity=".08"/>`;
    } else if (w === 'storm') {
      s += `<rect width="800" height="500" fill="#0c1030" opacity=".4"/>`;
      if (bolt) {
        const d = bolt.pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join(' '), o = Math.max(0, 1 - bolt.t / 12);
        s += `<path d="${d}" fill="none" stroke="#ffe96a" stroke-width="9" stroke-linejoin="round" opacity="${(o * 0.35).toFixed(2)}"/>
              <path d="${d}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" opacity="${o.toFixed(2)}"/>`;
      }
    } else if (w === 'snow') {
      s += `<rect width="800" height="500" fill="#bcd8f0" opacity=".14"/>`;
      if (lite) return s;
      for (let j = 0; j < 3; j++) {
        let g = '';
        for (let i = 0; i < 24; i++) {
          const y0 = ((i * 71 + j * 133) % 540) - 20, x0 = ((i * 117.3 + j * 97) % 840) - 20;
          for (const y of [y0, y0 - 540]) g += `<circle cx="${f1(x0 - wind * y * 0.04)}" cy="${f1(y)}" r="${(1.2 + j * 0.7).toFixed(1)}"/>`;
        }
        s += `<g id="wx${tag}${j}" fill="#fff" opacity="${(0.55 + j * 0.12).toFixed(2)}">${g}</g>`;
      }
    }
    return s;
  }
  // move os grupos do clima (chamado todo quadro; só mexe em atributos)
  function animWx(w, tag) {
    if (lite || !w) return;
    if (w === 'sun') { setAttrOnce('wx' + tag + '0', 'transform', `rotate(${f1(frameNo * 0.15 % 360)})`); return; }
    const sp = WX_SP[w]; if (!sp) return;
    const sl = -wind * 0.1 - 0.12;
    for (let j = 0; j < 3; j++) {
      const off = (frameNo * sp[j]) % 540;
      setAttrOnce('wx' + tag + j, 'transform', w === 'rain' ? `translate(${f1(off * -sl)} ${f1(off)})` : `translate(${f1(Math.sin(frameNo * 0.03 + j * 2) * 14 - wind * off * 0.04)} ${f1(off)})`);
    }
  }

  function weatherSvg() {
    if ((!weather && !wxPrev) || scene !== 'battle') return '';
    if (wxK >= 1) return wxLayer(weather, 'n');
    // transição suave entre o clima antigo e o novo
    return `<g opacity="${(1 - wxK).toFixed(2)}">${wxLayer(wxPrev, 'p')}</g><g opacity="${wxK.toFixed(2)}">${wxLayer(weather, 'n')}</g>`;
  }

  function weatherBadge() {
    if (!weather || scene !== 'battle') return '';
    const W_ = WEATHER[weather];
    let icon;
    if (weather === 'sun') icon = `<circle r="5.5" fill="#ffd34d"/>${Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45})" d="M0,-8 L0,-11" stroke="#ffd34d" stroke-width="1.8" stroke-linecap="round"/>`).join('')}`;
    else if (weather === 'rain') icon = `<path d="M-8,2 Q-9,-4 -3,-4 Q-1,-9 4,-6 Q9,-6 8,1 Z" fill="#9fb8d8"/><path d="M-5,5 l-1.5,4 M0,5 l-1.5,4 M5,5 l-1.5,4" stroke="#6ad0ff" stroke-width="1.6" stroke-linecap="round"/>`;
    else if (weather === 'snow') icon = `<g stroke="#dff4ff" stroke-width="1.7" stroke-linecap="round"><path d="M0,-8 V8 M-7,-4 L7,4 M-7,4 L7,-4"/></g><circle r="2" fill="#fff"/>`;
    else icon = `<path d="M-8,0 Q-9,-6 -3,-6 Q-1,-11 4,-8 Q9,-8 8,-1 Z" fill="#6a7090"/><path d="M1,1 L-3,7 L0,7 L-2,12 L4,5 L1,5 Z" fill="#ffe96a" stroke="#8a6a00" stroke-width=".5" stroke-linejoin="round"/>`;
    const pulse = wxK < 1 ? `<rect x="334" y="42" width="140" height="40" rx="14" fill="none" stroke="#ffd34d" stroke-width="3" opacity="${(1 - wxK).toFixed(2)}"/>` : '';
    return pulse + `<rect x="338" y="46" width="132" height="32" rx="12" fill="#0d1b2a" opacity=".72"/>
      <g transform="translate(358 62)">${icon}</g>
      <text x="374" y="59" font-size="11" font-weight="bold" fill="#fff">${W_.name}</text>
      <text x="374" y="72" font-size="9.5" fill="#bfe3ff">${W_.note}</text>`;
  }

  // golpe atual (e dica de troca quando o Pokémon tem dois golpes)
  function moveHud(u) {
    const wp = WEAPONS[curW(u)];
    if (netMode) return `<text x="40" y="57" font-size="11" font-weight="bold" fill="#7fe0f0">Rede pronta (acerte o ovo)</text>`;
    if (ballMode) return `<text x="40" y="57" font-size="11" font-weight="bold" fill="#ffd34d">Pokébola pronta</text>`;
    if (wp.none) return `<text x="40" y="57" font-size="11" fill="#cfe">Golpe: Splash (não causa dano)</text>`;
    const two = u.moves.length > 1, vr = wp.variant ? ` · ${MS.MODE_NOTE[wp.variant]}` : '';
    return `<circle cx="46" cy="53" r="4" fill="${TYPE_COLOR[wp.type]}" stroke="#000" stroke-width=".7"/>
      <text x="55" y="57" font-size="11" font-weight="bold" fill="#fff">${wp.label}${isVar(u) ? ' ★' : ''}</text>
      <text x="${two ? 222 : 222}" y="57" text-anchor="end" font-size="8.5" fill="#bfe3ff">${two ? `[G] ${u.mi + 1}/${u.moves.length}` : vr.replace(' · ', '')}</text>
      <text x="16" y="69" font-size="8.5" fill="#ffe9a8">${(MS.moveNote(wp) || 'golpe direto').slice(0, 52)}</text>`;
  }

  // minimapa dos mapas largos: mostra o terreno, os Pokémon e a janela da câmera; toque/arraste para olhar outras partes
  const MM = { x: 492, y: 58, w: 300, h: 34 };
  const inMini = p => p.x >= MM.x - 4 && p.x <= MM.x + MM.w + 4 && p.y >= MM.y - 4 && p.y <= MM.y + MM.h + 14;
  const miniPan = p => { panX = clamp((p.x - MM.x) / MM.w * W, VW / 2, W - VW / 2); };
  let mmShown = false, miniTerr = null;
  function mmViewSvg() {
    if (!mmShown) return '';
    const k = MM.w / W, vw = VW / cam.z, vx = clamp(cam.x - vw / 2, 0, W - vw);
    return `<rect x="${f1(MM.x + vx * k)}" y="${MM.y + 1}" width="${f1(vw * k)}" height="${MM.h - 2}" rx="3" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-width="1.4"/>`;
  }
  function miniSvg() {
    const k = MM.w / W, my = y => MM.y + clamp((y - 110) / 380, 0, 1) * MM.h;
    let s = `<rect x="${MM.x}" y="${MM.y}" width="${MM.w}" height="${MM.h}" rx="8" fill="#0d1b2a" opacity=".72"/>`;
    if (miniTerr === null) {            // o desenho do terreno no minimapa só é refeito quando o terreno muda
      let d = `M${MM.x},${MM.y + MM.h}`; const stp = Math.max(4, Math.round(W / 140));
      for (let x = 0; x < W; x += stp) d += ` L${f1(MM.x + x * k)},${f1(my(heights[x]))}`;
      miniTerr = `<path d="${d} L${MM.x + MM.w},${MM.y + MM.h} Z" fill="#6b8f4a" opacity=".85"/>`;
    }
    s += miniTerr;
    for (const q of pickups) s += `<circle cx="${f1(MM.x + q.x * k)}" cy="${f1(my(gy(q.x)) - 2)}" r="1.4" fill="#fff"/>`;
    for (const u of units) {
      if (!u.alive || u.hidden) continue;
      const isAct = u === activeUnit() && (state === 'aim' || state === 'ai');
      s += `<circle cx="${f1(MM.x + u.x * k)}" cy="${f1(my(u.y) - 3)}" r="${u.team === 2 ? 3.4 : isAct ? 3.6 : 2.6}" fill="${sideColor(u)}" stroke="${isAct ? '#fff' : '#000'}" stroke-width="${isAct ? 1.2 : 0.6}"/>`;
    }
    mmShown = true;      // o retângulo da câmera vai numa camada própria (não reescreve o painel todo enquanto a câmera anda)
    s += `<text x="${MM.x + MM.w}" y="${MM.y + MM.h + 11}" text-anchor="end" font-size="8.5" fill="#bfe3ff">mapa largo · arraste ou Q/E · C centraliza</text>`;
    return s;
  }

  // ordem dos turnos (menor atraso joga primeiro), como no painel dos mobiles
  function orderSvg() {
    const list = turnOrder().slice(0, 6); if (!list.length) return '';
    const base = list[0].delay, act = activeUnit(), y0 = 80;
    let s = `<rect x="8" y="${y0}" width="150" height="${20 + list.length * 14}" rx="10" fill="#0d1b2a" opacity=".66"/>
      <text x="18" y="${y0 + 13}" font-size="8.5" fill="#bfe3ff" letter-spacing="1.2">ORDEM · ATRASO</text>`;
    list.forEach((v, i) => {
      const y = y0 + 27 + i * 14, isAct = v === act && (state === 'aim' || state === 'ai');
      s += `<circle cx="20" cy="${y - 3.5}" r="3.6" fill="${sideColor(v)}" stroke="${isAct ? '#fff' : '#000'}" stroke-width="${isAct ? 1.3 : 0.6}"/>
        <text x="29" y="${y}" font-size="10" font-weight="${isAct ? 'bold' : 'normal'}" fill="${isAct ? '#ffe9a8' : '#fff'}">${v.name}${v.team === 1 ? ' (s)' : ''}</text>
        <text x="150" y="${y}" text-anchor="end" font-size="9.5" fill="#bfe3ff">${v.delay - base}</text>`;
    });
    return s;
  }

  // barra de baixo: mostrador do ângulo, força (com a marca do último tiro) e movimento
  function bottomBarSvg() {
    if (scene !== 'battle' || !(state === 'aim' || state === 'ai') || !teams[turnTeam]) return '';
    const u = activeUnit(); if (!u || !u.alive) return '';
    // mostrador: 0° = horizontal à frente do Pokémon; a fatia clara é a faixa que ele consegue escolher agora
    const el = elevOf(u), [wlo, whi] = aimWindow(u);
    const cx = 186, cy = 474, r = 22, P = d => [cx + Math.cos(d * Math.PI / 180) * r, cy - Math.sin(d * Math.PI / 180) * r];
    const w0 = Math.max(-40, wlo), w1 = Math.min(220, whi), p0 = P(w0), p1 = P(w1), pe = P(el);
    const bx = 216, bw = 312, py = 446, my = 476;
    let ticks = '';
    for (let i = 1; i < 10; i++) ticks += `M${f1(bx + bw * i / 10)},${py} v${i === 5 ? 12 : 6}`;
    const lp = u.lastPow;
    return `<rect x="152" y="434" width="388" height="58" rx="12" fill="#0d1b2a" opacity=".78"/>
      <path d="M${cx - r - 3},${cy} H${cx + r + 3}" stroke="#8aa0c8" stroke-width="1"/>
      <path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}" fill="none" stroke="#8aa0c8" stroke-opacity=".5" stroke-width="1"/>
      <path d="M${cx},${cy} L${f1(p0[0])},${f1(p0[1])} A${r},${r} 0 ${w1 - w0 > 180 ? 1 : 0} 0 ${f1(p1[0])},${f1(p1[1])} Z" fill="#6ad0ff" fill-opacity=".28" stroke="#6ad0ff" stroke-opacity=".7" stroke-width="1"/>
      <line x1="${cx}" y1="${cy}" x2="${f1(pe[0])}" y2="${f1(pe[1])}" stroke="#ffb43c" stroke-width="2.6" stroke-linecap="round"/>
      <text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff">${Math.round(el)}°</text>
      <text x="${cx}" y="${cy - r - 4}" text-anchor="middle" font-size="7.5" fill="#bfe3ff">${Math.round(wlo)}°–${Math.round(whi)}°</text>
      <text x="${bx}" y="${py - 3}" font-size="8" fill="#bfe3ff" letter-spacing="1.2">FORÇA</text>
      <rect x="${bx}" y="${py}" width="${bw}" height="12" rx="6" fill="#000" opacity=".55"/>
      ${charging ? `<rect x="${bx + 1}" y="${py + 1}" width="${f1(Math.max(0, power / 100 * (bw - 2)))}" height="10" rx="5" fill="url(#pow)"/>` : ''}
      <path d="${ticks}" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>
      ${lp !== null && lp !== undefined ? `<path d="M${f1(bx + bw * lp / 100)},${py - 1} l-4,-6 h8 Z" fill="#fff"/><text x="${f1(Math.min(bx + bw - 30, bx + bw * lp / 100 + 6))}" y="${py - 2}" font-size="7.5" fill="#fff" opacity=".8">último</text>` : ''}
      <text x="${bx}" y="${my - 3}" font-size="8" fill="#bfe3ff" letter-spacing="1.2">MOVER</text>
      <rect x="${bx + 44}" y="${my - 9}" width="${bw - 44}" height="6" rx="3" fill="#000" opacity=".55"/>
      <rect x="${bx + 45}" y="${my - 8}" width="${f1(Math.max(0, walkBudget / walkMax()) * (bw - 46))}" height="4" rx="2" fill="#9be36a"/>
      <text x="${bx + bw}" y="${my + 12}" text-anchor="end" font-size="8" fill="#bfe3ff">${teams[turnTeam].ai ? '' : 'P passa a vez · golpe forte = mais atraso'}</text>`;
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
    const isVolt = isVisit;
    const t = teams[turnTeam], u = activeUnit();
    let name, col;
    if (isVisit) { name = guest.name + ' (visitante)'; col = GUEST_COL; }
    else { name = t.ai ? `${u.name} selvagem` : u.name; col = t.color; }
    const mine = !isVolt && u && !t.ai;
    const secs = Math.max(0, Math.ceil(turnT / 60));
    const wmax = Math.max(1, (kind === 'campaign' ? STAGES[stageIdx].wind : 3) * 1.15), wk = clamp(windS / wmax, 0, 1);
    const wcx = 352, wcy = 25, wl = 3 + 8 * wk, wdx = Math.cos(windA), wdy = -Math.sin(windA);
    let s = `
      <rect x="8" y="8" width="222" height="${mine ? 66 : 40}" rx="12" fill="#0d1b2a" opacity=".72"/>
      <circle cx="26" cy="24" r="7" fill="${col}" stroke="#fff" stroke-width="2"/>
      <text x="40" y="29" font-size="14" font-weight="bold" fill="#fff">Vez: ${name}</text>
      ${mine && state === 'aim' ? `<text x="220" y="29" text-anchor="end" font-size="13" font-weight="bold" fill="${secs <= 5 ? '#ff6b5a' : '#ffe9a8'}">${secs}s</text>` : ''}
      ${mine ? moveHud(u) : ''}
      <rect x="330" y="8" width="140" height="34" rx="12" fill="#0d1b2a" opacity=".72"/>
      <circle cx="${wcx}" cy="${wcy}" r="12" fill="#000" fill-opacity=".35" stroke="#8fe0ff" stroke-opacity=".5" stroke-width="1.2"/>
      ${windS > 0.05 ? `<line x1="${f1(wcx - wdx * wl)}" y1="${f1(wcy - wdy * wl)}" x2="${f1(wcx + wdx * wl)}" y2="${f1(wcy + wdy * wl)}" stroke="#8fe0ff" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M0,-4 L6,0 L0,4 Z" fill="#8fe0ff" transform="translate(${f1(wcx + wdx * wl)} ${f1(wcy + wdy * wl)}) rotate(${f1(-windA * 57.3)})"/>` : ''}
      <text x="372" y="21" font-size="9" fill="#ddd" letter-spacing="1.5">${windS > 0.05 ? 'VENTO' : 'SEM VENTO'}</text>
      <text x="372" y="37" font-size="14" font-weight="bold" fill="#8fe0ff">${Math.round(windS * 8)}</text>`;
    s += orderSvg();
    s += weatherBadge();
    if (W > VW) s += miniSvg();
    if (ORIG) s += `<rect x="238" y="8" width="84" height="40" rx="12" fill="#0d1b2a" opacity=".72"/>
        <g transform="translate(258 38) scale(1.15)">${eggSvg('#e0583a')}</g>
        <text x="274" y="33" font-size="16" font-weight="bold" fill="#fff">×${stageEggs.length}</text>
        <text x="314" y="44" text-anchor="end" font-size="7.5" fill="#bbb">${eggs.length ? eggs.length + ' no chão [B]' : 'ovos'}</text>`;
    else {
      s += `<rect x="238" y="8" width="84" height="40" rx="12" fill="#0d1b2a" opacity=".72"/>
        ${ballIcon(258, 28, 9)}
        <text x="274" y="33" font-size="16" font-weight="bold" fill="#fff">×${campaign.balls}</text>
        <text x="312" y="43" text-anchor="end" font-size="8" fill="#bbb">[B]</text>`;
      if (campaign.great > 0 || campaign.ultra > 0) {
        s += `<rect x="238" y="52" width="92" height="22" rx="11" fill="#0d1b2a" opacity=".72"/>
          <g transform="translate(252 63)">${Art.ball(6, 0, 0, BALLS.great.col)}</g><text x="262" y="67" font-size="12" font-weight="bold" fill="#fff">×${campaign.great}</text>
          <g transform="translate(290 63)">${Art.ball(6, 0, 0, BALLS.ultra.col)}</g><text x="300" y="67" font-size="12" font-weight="bold" fill="#fff">×${campaign.ultra}</text>`;
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
    if (p.under) return '';
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
      case 'poison': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1 + 2 * k)}" fill="#c783e4" opacity="${(k * 0.55).toFixed(2)}"/>`;
        });
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})">
          <path d="M-8,-3 L9,0 L-8,3 L-4,0 Z" fill="#b45ac8" stroke="#592468" stroke-width="1" stroke-linejoin="round"/>
          <path d="M-5,-1 L5,0" fill="none" stroke="#f0cef6" stroke-width=".8"/></g>`;
      }
      case 'ice': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1 + 2.4 * k)}" fill="#dff4ff" opacity="${(k * 0.55).toFixed(2)}"/>`;
        });
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})">
          <path d="M-9,0 L-2,-4.4 L10,0 L-2,4.4 Z" fill="#bfeaf6" stroke="#4a8ab0" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M-5,0 L6,0" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></g>`;
      }
      case 'ghost': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(2 + 4 * k)}" fill="#6a4a9a" opacity="${(k * 0.4).toFixed(2)}"/>`;
        });
        const k = 0.5 + 0.5 * Math.sin(frameNo * 0.4);
        return ph + `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(8 + k * 1.4)}" fill="#8a6ac0" opacity=".35"/>
          <circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="6" fill="#2a1848" stroke="#b496e0" stroke-width="1.4"/>
          <circle cx="${f1(p.x - 1.6)}" cy="${f1(p.y - 1.8)}" r="1.6" fill="#e0d0f8" opacity=".8"/>`;
      }
      case 'punch': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1.5 + 3 * k)}" fill="#fff0c8" opacity="${(k * 0.5).toFixed(2)}"/>`;
        });
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})">
          <circle r="6.6" fill="#f2c9a0" stroke="#7a3a1c" stroke-width="1.3"/>
          <path d="M-1,-5 L-1,5 M2.4,-4.4 L2.4,4.4" stroke="#7a3a1c" stroke-width=".9" opacity=".7"/>
          <path d="M-12,-3 L-7,-2 M-13,0 L-7,0 M-12,3 L-7,2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/></g>`;
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
        { const sz = p.wp.size || 1;
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * (sz > 1.2 ? 5 : 9) + p.spin * 50) % 360}) scale(${sz})">
          <path d="M-8,-3 L-3,-8 L5,-7 L9,-1 L6,6 L-3,8 L-9,3 Z" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M-4,-2 L1,-4 M0,3 L4,1" stroke="#4a4a56" stroke-width=".9" stroke-linecap="round"/></g>`; }
      }
      case 'psy': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1 + 4 * k)}" fill="#ff8ad0" opacity="${(k * 0.35).toFixed(2)}"/>`;
        });
        const a = frameNo * 0.3;
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)})"><circle r="9" fill="#ff8ad0" opacity=".25"/>
          <circle r="6" fill="none" stroke="#ffc2e8" stroke-width="1.4" stroke-dasharray="4 3" transform="rotate(${(a * 57) % 360})"/>
          <circle r="3.4" fill="#fff"/><circle cx="${f1(Math.cos(a) * 7)}" cy="${f1(Math.sin(a) * 7)}" r="1.6" fill="#b78aff"/></g>`;
      }
      case 'sound': {
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI, k = (frameNo % 14) / 14;
        return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})" fill="none" stroke-linecap="round">
          <path d="M-2,-9 Q8,0 -2,9" stroke="#bfe9ff" stroke-width="2.4" opacity="${(1 - k).toFixed(2)}" transform="translate(${f1(k * -10)} 0)"/>
          <path d="M3,-7 Q11,0 3,7" stroke="#fff" stroke-width="2.4"/>
          <path d="M9,-5 Q14,0 9,5" stroke="#ff9ad0" stroke-width="2" opacity=".8"/></g>`;
      }
      case 'powder': {
        let dots = '';
        for (let i = 0; i < 7; i++) {
          const a = frameNo * 0.12 + i * 0.9, r = 3 + (i % 3) * 3;
          dots += `<circle cx="${f1(Math.cos(a) * r)}" cy="${f1(Math.sin(a * 1.3) * r)}" r="${1.2 + (i % 2)}" fill="${i % 2 ? '#e8d8ff' : '#b99cff'}" opacity=".85"/>`;
        }
        return `<g transform="translate(${f1(p.x)} ${f1(p.y)})"><circle r="10" fill="#d8c8ff" opacity=".22"/>${dots}</g>`;
      }
      case 'net':
        return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 9) % 360}) scale(1.15)">${NET_SVG}</g>`;
      case 'bone': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 17) % 360}) scale(1.1)">${BONE_SVG}</g>`;
      case 'crumb': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 7) % 360}) scale(1.15)">${CRUMB_SVG}</g>`;
      case 'dung': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 11) % 360}) scale(1.1)">${DUNG_SVG}</g>`;
      case 'egg': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 14) % 360}) scale(1.1)">${EGG_P}</g>`;
      case 'roach': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(Math.atan2(p.vy, p.vx) * 57.3)}) scale(1.1)">${ROACH_P}</g>`;
      case 'spike': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(Math.atan2(p.vy, p.vx) * 57.3)}) scale(1.1)">${SPIKE_P}</g>`;
      case 'tongue': { const o = p.ownerUnit, m = o && o.alive ? mouthAt(o, o.face, false) : null; return (m ? `<line x1="${f1(m.x)}" y1="${f1(m.y)}" x2="${f1(p.x)}" y2="${f1(p.y)}" stroke="#ff6a8a" stroke-width="2.6" stroke-linecap="round"/>` : '') + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) scale(1.1)">${TONGUE_P}</g>`; }
      case 'poop': return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 6) % 360}) scale(${((p.wp.size || 1) * 1.15).toFixed(2)})">${POOP_P}</g>`;
      case 'bee': return `<g transform="translate(${f1(p.x)} ${f1(p.y + Math.sin(frameNo * 0.5 + p.spin) * 1.5)}) scale(${p.vx < 0 ? -1.5 : 1.5} 1.5)">${MS.BEE_MINI || ''}</g>`;
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

  function netsSvg() {
    let s = '';
    for (const n of nets) { const q = netPos(n); s += `<g transform="translate(${f1(q.x)} ${f1(q.y + 8)}) scale(${(1.35 - q.k * 0.4).toFixed(2)})">${eggSvg(n.e.col)}</g><g transform="translate(${f1(q.x)} ${f1(q.y)}) rotate(${f1(q.k * 340)}) scale(${(1.9 - q.close * 0.75).toFixed(2)})">${NET_SVG}</g>`; }
    for (const e of stageEggs) {
      if (e.baby || !e.u || !e.u.alive) continue;
      const u = e.u, x = u.x - u.face * 12;
      s += `<g transform="translate(${f1(x)} ${f1(u.y)}) scale(.95)">${eggSvg(e.col)}</g><g transform="translate(${f1(x)} ${f1(u.y - 7)}) scale(.95)" opacity=".75">${NET_SVG}</g>`;
    }
    return s;
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
    const S = spOf(u), bounce = Math.sin(aF() * 0.2) * 2.5;
    if (ORIG) return `<g transform="translate(0 ${f1(-(S.h * u.scale + 30) + bounce)}) scale(.8)">${eggSvg(eggCol(u.sp))}</g>`;
    let s = `<g transform="translate(0 ${f1(-(S.h * u.scale + 36) + bounce)})">${Art.ball(6, 0)}</g>`;
    if (ballMode) s += `<text x="0" y="${f1(-(S.h * u.scale + 46))}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffd34d" stroke="#000" stroke-width=".7">${Math.round(captureChance(u) * 100)}%</text>`;
    return s;
  }

  function renderBattleUnits(act) {
    const items = [];
    for (const u of units) {
      if (!u.alive || u.hidden) continue;
      const isFoe = kind === 'campaign' && u.team >= 1;
      const p = unitParts(u, u.team === 2 ? { extra: `<text x="0" y="-26" text-anchor="middle" font-size="8.5" font-weight="bold" fill="${GUEST_COL}" stroke="#000" stroke-width=".5" letter-spacing="1">VISITANTE</text>` } : {});
      let h = p.h;
      if (isFoe && u.hp / u.maxhp <= WEAK && state !== 'capture') h += weakMarker(u);
      if (u === act && (state === 'aim' || state === 'ai') && !teams[turnTeam].ai)
        h += `<path transform="translate(0 ${f1(-(spOf(u).h * u.scale + 34) + Math.sin(aF() * 0.15) * 3)})" d="M-6,0 L6,0 L0,8 Z" fill="${teams[u.team].color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>`;
      items.push({ k: u.uid, t: p.t, h });
    }
    return items;
  }

  function aimSvg(x1, y1, a, rel) {
    const x2 = x1 + Math.cos(a) * 46, y2 = y1 - Math.sin(a) * 46;
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"
              stroke="#fff" stroke-opacity=".85" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>
             <g transform="translate(${f1(x2)} ${f1(y2)})">
               <circle r="6" fill="none" stroke="${netMode ? '#7fe0f0' : ballMode ? '#ffd34d' : '#ff4d4d'}" stroke-width="2"/>
               <path d="M-10,0 L-4,0 M4,0 L10,0 M0,-10 L0,-4 M0,4 L0,10" stroke="${netMode ? '#7fe0f0' : ballMode ? '#ffd34d' : '#ff4d4d'}" stroke-width="2" stroke-linecap="round"/>
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

  // ---------- Desenho em WebGL ----------
  // o mundo (céu, fundos, terreno, água, Pokémon, tiros, efeitos, clima) é desenhado num <canvas> pela placa de vídeo;
  // painel, menus e botões continuam no SVG por cima. Fase da cidade e aparelhos sem WebGL usam o desenho SVG.
  let GLR = null, glActive = false, glP = 1, glFailed = false;
  const glSnap = {};                                  // camada -> { ok, ver, busy, vb }
  let glBgDirty = true, glSkyDirty = true, glBgVer = 0;
  let glTerr = null, glTerrOk = false, glTerrBusy = false, glFullT = true, glBox = null, glSnapAt = -99, glSeq = 0, glPunches = [];
  const SVGNS = 'http://www.w3.org/2000/svg';
  const glCan = () => !!(GLR && !glFailed && settings.render !== 'svg');
  let glResK = 1, glGen = 0, glGenAt = 0, glResetOk = false;
  let glLoading = false, glLoadAt = 0, glLoadFade = 0, glLoadProg = 0;   // tela "Preparando…" enquanto fotos e poses ficam prontas
  const glStartLoad = () => { glLoading = true; glLoadAt = 0; glLoadProg = 0; };

  let defsEls = null;
  function defsFor(src) {
    if (!defsEls) { defsEls = {}; document.querySelectorAll('defs > [id]').forEach(e => { defsEls[e.id] = e; }); }
    const seen = new Set(), out = [];
    const scan = s => {
      const re = /url\(#([^)"']+)\)|href="#([^"]+)"/g; let m;
      while ((m = re.exec(s))) {
        const id = m[1] || m[2]; if (seen.has(id)) continue; seen.add(id);
        let e = defsEls[id]; if (!e || !e.isConnected) { e = document.getElementById(id); if (e) defsEls[id] = e; }
        if (e) { const h = e.outerHTML; out.push(h); scan(h); }
      }
    };
    scan(src);
    return out.length ? '<defs>' + out.join('') + '</defs>' : '';
  }

  function glInit() {
    if (GLR || glFailed || settings.render === 'svg' || typeof document === 'undefined' || !MS.makeGL) return;
    const cv = document.getElementById('glc'); if (!cv || !cv.getContext) return;
    try { GLR = MS.makeGL(cv, { defsFor }); } catch (_) { GLR = null; }
    if (!GLR) { glFailed = true; return; }
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); glFailed = true; GLR = null; glActive = false; document.body.classList.remove('gl'); layoutLayers(); dirty = true; });
    glSize();
  }
  // resolução do canvas: a mesma do palco na tela (até 2 pixels por ponto); no modo leve, um pouco menor
  function glSize() {
    const cv = typeof document !== 'undefined' && document.getElementById('glc'); if (!cv || !GLR) return;
    const st = $('stage'), r = st.getBoundingClientRect ? st.getBoundingClientRect() : { width: 800 };
    const dpr = Math.min(2, window.devicePixelRatio || 1) * (lite ? 0.7 : 1);
    const w = Math.max(320, Math.round((r.width || 800) * dpr)), h = Math.round(w * 5 / 8);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; glBgDirty = true; glFullT = true; GLR.resetAtlas(); glResetOk = true; glHudHave = null; }   // desenhos refeitos na resolução nova
    glP = w / VW; GLR.resize(w, h);
  }
  function glUse() {
    const on = glCan() && scene !== 'intro';
    if (on !== glActive) {
      glActive = on;
      document.body.classList.toggle('gl', on);
      if (on) { glBgDirty = true; glFullT = true; glSize(); glStartLoad(); }
      else { layoutLayers(); dirty = true; terrDirty = true; }
    }
    return on;
  }
  function toggleRender() {
    settings.render = settings.render === 'svg' ? 'webgl' : 'svg';
    if (settings.render === 'webgl') { glFailed = false; glInit(); if (!GLR) { settings.render = 'svg'; showMsg('Este aparelho não tem WebGL', 120); } }
    applySettings(); Sfx.click();
  }
  // marca uma área do terreno para ser redesenhada (em unidades do mundo)
  function glMark(x0, y0, x1, y1) {
    if (!glBox) glBox = [x0, y0, x1, y1];
    else { glBox[0] = Math.min(glBox[0], x0); glBox[1] = Math.min(glBox[1], y0); glBox[2] = Math.max(glBox[2], x1); glBox[3] = Math.max(glBox[3], y1); }
  }
  // buraco imediato na imagem do terreno (o desenho completo daquela área chega logo depois)
  function glApplyPunch(c, p) {
    const t = glTerr;
    c.save(); c.setTransform(t.sx, 0, 0, t.sy, 40 * t.sx, 20 * t.sy);
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(p.cx, p.cy, p.r, 0, 7); c.fill();
    c.restore();
  }
  function glPunch(cx, cy, r) {
    if (!glTerr || !glActive) return;
    const p = { cx, cy, r, seq: ++glSeq }; glPunches.push(p); if (glPunches.length > 80) glPunches.shift();
    glApplyPunch(glTerr.ctx, p);
    const t = glTerr;
    glTerrSub((cx - r - 2 + 40) * t.sx, (cy - r - 2 + 20) * t.sy, (2 * r + 4) * t.sx + 2, (2 * r + 4) * t.sy + 2);
  }
  // o terreno é dividido em faixas verticais que cabem numa textura da placa de vídeo
  function glTerrUpload() {
    const t = glTerr, tw = Math.min(4096, GLR.maxTex), n = Math.ceil(t.cv.width / tw);
    for (let i = n; i < (t.n || 0); i++) GLR.dropTex('terr' + i);
    t.n = n; t.tw = tw;
    for (let i = 0; i < n; i++) GLR.setTexPart('terr' + i, t.cv, i * tw, 0, Math.min(tw, t.cv.width - i * tw), t.cv.height);
  }
  function glTerrSub(x, y, w, h) { const t = glTerr; for (let i = 0; i < (t.n || 0); i++) GLR.subTex('terr' + i, t.cv, x, y, w, h, i * t.tw, 0); }
  // "foto" de uma camada SVG do jogo (com as definições de gradientes e padrões que ela usa)
  function glPhoto(el, vb, res, drop, cb) {
    let s;
    try {
      const c = el.cloneNode(true);
      for (const id of drop) { const e = c.querySelector('#' + id); if (e) e.remove(); }
      const w = Math.max(1, Math.round(vb[2] * res)), h = Math.max(1, Math.round(vb[3] * res));
      c.removeAttribute('style'); c.removeAttribute('class'); c.removeAttribute('id');
      c.setAttribute('viewBox', vb.map(v => +v.toFixed(4)).join(' ')); c.setAttribute('width', w); c.setAttribute('height', h);
      c.setAttribute('preserveAspectRatio', 'none'); c.setAttribute('overflow', 'hidden');
      s = new XMLSerializer().serializeToString(c);
      s = s.replace(/<svg[^>]*>/, m => m + defsFor(s));
      // arquivo na memória (blob) é mais leve que um endereço data: gigante; se o navegador recusar, tenta o data:
      const load = (blob) => {
        const im = new Image(); let url = null;
        if (blob) { try { url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })); } catch (_) { return load(false); } }
        im.onload = () => { try { cb(im, w, h); } catch (_) { if (blob) { if (url) URL.revokeObjectURL(url); return load(false); } cb(null); } if (url) URL.revokeObjectURL(url); };
        im.onerror = () => { if (url) URL.revokeObjectURL(url); if (blob) load(false); else cb(null); };
        im.src = url || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      };
      load(typeof Blob !== 'undefined' && typeof URL !== 'undefined' && !!URL.createObjectURL);
    } catch (_) { cb(null); }
  }
  const GL_BG = [   // nome, svg, profundidade, índice em LAYERS (área), resolução relativa
    ['sky', 'sSky', 0, -1, 0.5], ['far', 'sFar', 0.25, 0, 0.8], ['near', 'sNear', 0.5, 1, 0.9], ['mid', 'sMid', 0.65, 2, 1], ['fore', 'sFore', 1.3, 5, 1]
  ];
  function glBgSnap(only) {
    const ver = ++glBgVer;
    for (const [name, svgId, , li, rs] of GL_BG) {
      if (only && name !== only) continue;
      const vb = li < 0 ? [0, 0, 800, 500] : LAYERS[li][2](W);
      const res = Math.min(glP * rs, GLR.maxTex / vb[2], GLR.maxTex / vb[3]);
      const S = glSnap[name] || (glSnap[name] = {});
      S.vb = vb; S.ver = ver; if (!only) S.ok = false;
      glPhoto($(svgId), vb, res, name === 'sky' ? ['clouds'] : [], (im, w, h) => {
        if (!GLR || S.ver !== ver || !im) return;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        GLR.setTex('bg_' + name, c); S.ok = true; c.width = 0;
      });
    }
    // gradientes do mar (tiras de 1 pixel)
    for (const [k, a, b] of [['seaB', 'seaBS0', 'seaBS1'], ['seaF', 'seaFS0', 'seaFS1']]) {
      const c = document.createElement('canvas'); c.width = 2; c.height = 64;
      const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 64);
      const st = id => { const e = $(id); const col = e.getAttribute('stop-color'), op = e.getAttribute('stop-opacity'); const v = GLR.parseCol(col); return `rgba(${v[0] * 255 | 0},${v[1] * 255 | 0},${v[2] * 255 | 0},${op === null ? 1 : +op})`; };
      g.addColorStop(0, st(a)); g.addColorStop(1, st(b)); x.fillStyle = g; x.fillRect(0, 0, 2, 64);
      GLR.setTex(k, c);
    }
  }
  // terreno: foto completa (início da fase) ou só da área que mudou (explosões)
  function glTerrSnap(full) {
    const svgEl = $('sWB'), drop = ['waveBack', 'introBack', 'pickups', 'tfill'];
    if (full) {
      const vbw = W + 80, vbh = 540;
      const TS = Math.min(glP * (noZoom() ? 1 : 1.6), 2.4, GLR.maxTex / vbh, Math.sqrt(6e6 / (vbw * vbh)));   // nítido no zoom, até ~6 milhões de pixels
      const seq = glSeq, ww = W;
      glTerrBusy = true; glFullT = false; glBox = null; glSnapAt = frameNo;
      glPhoto(svgEl, [-40, -20, vbw, vbh], TS, drop, (im, w, h) => {
        glTerrBusy = false;
        if (!GLR || !im || ww !== W) return;
        let t = glTerr;
        if (!t || t.cv.width !== w || t.cv.height !== h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; t = glTerr = { cv, ctx: cv.getContext('2d') }; }
        t.sx = w / vbw; t.sy = h / vbh;
        t.ctx.clearRect(0, 0, w, h); t.ctx.drawImage(im, 0, 0, w, h);
        for (const p of glPunches) if (p.seq > seq) glApplyPunch(t.ctx, p);
        glTerrUpload(); glTerrOk = true;
      });
      return;
    }
    const t = glTerr, b = glBox; glBox = null; if (!t) return;
    const i0 = clamp(Math.floor((b[0] + 40) * t.sx), 0, t.cv.width), j0 = clamp(Math.floor((b[1] + 20) * t.sy), 0, t.cv.height);
    const i1 = clamp(Math.ceil((b[2] + 40) * t.sx), 0, t.cv.width), j1 = clamp(Math.ceil((b[3] + 20) * t.sy), 0, t.cv.height);
    if (i1 - i0 < 1 || j1 - j0 < 1) return;
    const vb = [-40 + i0 / t.sx, -20 + j0 / t.sy, (i1 - i0) / t.sx, (j1 - j0) / t.sy], seq = glSeq, ref = t;
    glTerrBusy = true; glSnapAt = frameNo;
    glPhoto(svgEl, vb, t.sx, drop, (im) => {
      glTerrBusy = false;
      if (!GLR || !im || glTerr !== ref) return;
      const c = t.ctx;
      c.clearRect(i0, j0, i1 - i0, j1 - j0); c.drawImage(im, i0, j0, i1 - i0, j1 - j0);
      for (const p of glPunches) if (p.seq > seq) glApplyPunch(c, p);
      glTerrSub(i0, j0, i1 - i0, j1 - j0);
    });
  }
  function glSchedule() {
    if (glBgDirty) { glBgDirty = false; glSkyDirty = false; glBgSnap(); }
    else if (glSkyDirty) { glSkyDirty = false; glBgSnap('sky'); }
    if (glShader()) { glTUpload(); return; }                      // terreno pela placa de vídeo: sem fotos
    if (dirty || glTerrBusy) return;                              // espera o SVG do terreno estar em dia
    if (glFullT) glTerrSnap(true);
    else if (glBox && frameNo - glSnapAt >= 6) glTerrSnap(false);
  }

  // matriz de uma camada: mesma conta do placeLayers (profundidade f)
  function glLayer(f) {
    const z = 1 + (cam.z - 1) * f;
    const cx = 400 + (cam.x + cam.sx - 400) * f, cy = 250 + (cam.y + cam.sy - 250) * f;
    GLR.setBase(z, 400 - cx * z, 250 - cy * z);
  }
  function glDrawSnap(name) {
    const S = glSnap[name]; if (!S || !S.ok) return;
    const T = GLR.tex('bg_' + name); if (!T) return;
    GLR.img('bg_' + name, 0, 0, T.w, T.h, S.vb[0], S.vb[1], S.vb[2], S.vb[3]);
  }

  // ---------- terreno pela placa de vídeo (shader) ----------
  // o mapa de chão vira uma textura de dados; o shader pinta terra, rocha, grama, capim, queimado e a fatia 2.5D.
  // explosão: só as colunas atingidas são recalculadas e reenviadas — o buraco aparece no mesmo quadro
  let glTD = null, glTC = null, glTFull = true, glTX0 = 1e9, glTX1 = -1, glTColsDirty = false;
  const glShader = () => glActive && GLR && GLR.terrOk();
  function glTMark(x0, x1, burn) {
    glTX0 = Math.min(glTX0, Math.max(0, Math.floor(x0))); glTX1 = Math.max(glTX1, Math.min(W - 1, Math.ceil(x1))); glTColsDirty = true;
    if (burn && glTD && !glTFull) {            // anel queimado em volta da cratera (canal A)
      const { cx, cy, r } = burn, R2 = r + 6;
      for (let y = Math.max(0, Math.floor(cy - R2)); y <= Math.min(H - 1, cy + R2); y++)
        for (let x = Math.max(0, Math.floor(cx - R2)); x <= Math.min(W - 1, cx + R2); x++) {
          const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), k = 1 - Math.abs(dd - (r + 2)) / 3.2;
          if (k > 0) { const o = (y * W + x) * 4 + 3; glTD[o] = Math.max(glTD[o], Math.round(255 * Math.min(1, k * 1.25))); }
        }
      glTX0 = Math.min(glTX0, Math.max(0, Math.floor(cx - R2))); glTX1 = Math.max(glTX1, Math.min(W - 1, Math.ceil(cx + R2)));
    }
  }
  function glTCols(x0, x1) {                    // chão e profundidade (canais R e G), coluna por coluna
    const d = glTD;
    for (let x = x0; x <= x1; x++) {
      let run = 0;
      for (let y = 0; y < H; y++) {
        const o = (y * W + x) * 4;
        if (mask[y * W + x]) { d[o] = 255; d[o + 1] = Math.min(255, run); run++; }
        else { d[o] = 0; d[o + 1] = 0; run = 0; }
      }
    }
  }
  function glTColsTex() {                       // grama, capim e topo de cada coluna
    if (!glTC || glTC.length !== W * 4) glTC = new Uint8Array(W * 4);
    for (let x = 0; x < W; x++) {
      const t = Math.max(0, Math.min(65535, Math.round(heights[x]))), o = x * 4;
      glTC[o] = grass[x] ? 255 : 0; glTC[o + 1] = Math.round(Math.min(12.7, tuft[x] || 0) * 20); glTC[o + 2] = t & 255; glTC[o + 3] = t >> 8;
    }
    GLR.terrCols(glTC, W);
  }
  function glTUpload() {
    if (glTFull || !glTD || glTD.length !== W * H * 4) {
      glTD = new Uint8Array(W * H * 4); glTCols(0, W - 1);
      GLR.terrData(glTD, W, H); glTColsTex();
      glTFull = false; glTX0 = 1e9; glTX1 = -1; glTColsDirty = false; glTerrOk = true; glFullT = false; glBox = null;
      return;
    }
    if (glTX1 >= glTX0) { glTCols(glTX0, glTX1); GLR.terrData(glTD, W, H, glTX0, glTX1); glTX0 = 1e9; glTX1 = -1; }
    if (glTColsDirty) { glTColsTex(); glTColsDirty = false; }
  }
  function glLights() {                         // até 4 luzes: explosões, raios e tiros de fogo
    const L = [];
    for (const f of fx) {
      const k = 1 - f.t / f.max; if (k <= 0) continue;
      if (f.sky) { const q = f.pts[f.pts.length - 1]; L.push({ x: q[0], y: q[1], r: 140, k: 1.1 * k, col: '#fff3a0' }); }
      else if (f.beam) L.push({ x: (f.x + f.x2) / 2, y: (f.y + f.y2) / 2, r: 160, k: 0.7 * k, col: '#ffd27a' });
      else if (!f.bolt) L.push({ x: f.x, y: f.y, r: f.r * 3.2, k: 1.2 * k * k, col: LIGHT_COL[f.style] || '#ffb347' });
    }
    for (const p of projs) { const c = PROJ_LIGHT[p.wp.style]; if (c && !p.under && p.wk !== 'ball') L.push({ x: p.x, y: p.y, r: 70, k: 0.45, col: c }); }
    if (flash.a > 0.05) L.push({ x: cam.x, y: 0, r: 900, k: flash.a * 0.5, col: '#ffffff' });
    return L.sort((a, b) => b.k - a.k).slice(0, 4);
  }
  const LIGHT_COL = { fire: '#ff9a3c', dragon: '#b08aff', thunder: '#fff27a', water: '#9fdcff', ice: '#cff3ff', psy: '#ff9ad8', ghost: '#a68ae0', leaf: '#b8f07a', poison: '#d08ae8' };
  const PROJ_LIGHT = { fire: '#ff8a2a', dragon: '#9a7aff', thunder: '#fff27a', psy: '#ff8ad0', ghost: '#8a6ac0' };
  function glDrawTerrain() {
    const t = THEMES[themeKey], y1 = parseFloat($('dirt').getAttribute('y1')) || 160;
    GLR.drawTerrain({ d0: t.dirt[0], d1: t.dirt[1], d2: t.dirt[2], s1: t.s1, s2: t.s2, g0: t.g[0], g1: t.g[1], g2: t.g[2],
      dy: [y1, 500], ph: terrPh, px: glP, lights: lite ? [] : glLights() });
    // árvores, pedras e flores (desenho SVG de cada uma vira imagem)
    const R = GLR;
    for (const d of decor) {
      const key = 'dc|' + d.type + '|' + (d.col || ''), snip = () => Art.decor({ ...d, x: 0, base: -1, s: 1 });
      const s = R.svg(key, snip, measureBox(key, snip, [-40, -110, 80, 116]), R.res * Math.max(1, d.s));
      if (s) { R.push(); R.tr(d.x, d.base + 1); R.sc(d.s); R.spr(s); R.pop(); }
    }
  }
  // contorno de um desenho SVG qualquer (medido uma vez num SVG escondido)
  const boxCache = {};
  function measureBox(key, snip, fallback) {
    if (boxCache[key]) return boxCache[key];
    let box = null;
    try {
      let m = document.getElementById('glMeasure');
      if (!m) {
        m = document.createElementNS(SVGNS, 'svg'); m.id = 'glMeasure'; m.setAttribute('width', '10'); m.setAttribute('height', '10');
        m.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(m);
      }
      m.innerHTML = `<g>${typeof snip === 'function' ? snip() : snip}</g>`;
      const b = m.firstChild.getBBox(); m.innerHTML = '';
      if (b && b.width > 0) box = [b.x - 3, b.y - 3, b.width + 6, b.height + 6];
    } catch (_) { box = null; }
    return (boxCache[key] = box || fallback);
  }
  // contorno do desenho de cada espécie (medido uma vez no SVG escondido)
  const artBoxes = {};
  function artBox(sp) {
    if (artBoxes[sp]) return artBoxes[sp];
    const S = SPECIES[sp]; let box = null;
    try {
      let m = document.getElementById('glMeasure');
      if (!m) {
        m = document.createElementNS(SVGNS, 'svg'); m.id = 'glMeasure'; m.setAttribute('width', '10'); m.setAttribute('height', '10');
        m.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(m);
      }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const f of [0, 24, 48, 72]) for (const flap of [false, true]) {
        m.innerHTML = `<g>${Art.draw(sp, { f, blink: false, breath: f === 48 ? 10 : 0, bob: 0, step: f === 24 ? 1.6 : f === 72 ? -1.6 : 0, x: 0, charge: false, flap })}</g>`;
        const b = m.firstChild.getBBox();
        if (b && b.width > 0) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
      }
      m.innerHTML = '';
      if (x1 > x0) box = [x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12];
    } catch (_) { box = null; }
    if (!box) box = [-70, -(S.h + 40), 140, S.h + 56];
    return (artBoxes[sp] = box);
  }
  // pose do Pokémon como imagem: parado (12 quadros, vai e volta), andando (6), atacando (4) e piscando
  function glBodyKey(u, res, q, mode) { return `u|${u.sp}|${u.sh ? 1 : 0}|${mode}${q}|${u.flying ? 1 : 0}${u.puffed ? 'p' : ''}|${res}`; }
  function glBodySpr(u, res, q, mode) {
    const box = artBox(u.sp);
    return GLR.svg(glBodyKey(u, res, q, mode), () => {
      const walk = mode === 'w', ctx = { f: q * 8, blink: mode === 'k', breath: mode === 'b' ? 10 : 0, bob: 0,
        step: walk ? Math.sin(q * Math.PI / 3) * 1.6 : 0, x: 0, charge: false, flap: !!u.flying, mania: mode === 'm' ? (q + 0.5) / 8 : null, hurt: mode === 'h', puffed: !!u.puffed };
      return `<g${shF(u.sp, u.sh)}>${Art.draw(u.sp, ctx)}</g>`;
    }, box, res);
  }
  function glBodyRes(u) {
    const box = artBox(u.sp);
    return Math.max(0.5, Math.round(Math.min(GLR.res * u.scale, 340 / Math.max(box[2], box[3])) * 4) / 4);   // no máximo ~340 px por pose
  }
  function glBody(u) {
    const R = GLR, box = artBox(u.sp);
    const res = glBodyRes(u);
    let q, mode;
    if (u.moving) { const ph = ((u.walkT * 0.5) % 6.2832 + 6.2832) % 6.2832; q = Math.round(ph / 1.0472) % 6; mode = 'w'; }
    else if (u.breath > 0) { q = (frameNo >> 3) % 4; mode = 'b'; }
    else if (u.hurt > 0 && spOf(u).orig) { q = 0; mode = 'h'; }
    else if (maniaOf(u) !== null) { q = Math.min(7, Math.floor(maniaOf(u) * 8)); mode = 'm'; }
    else if (!lite && blink(u)) { q = 0; mode = 'k'; }
    else { const t = ((frameNo + u.uid * 29) >> (lite ? 4 : 3)) % 14; q = t < 8 ? t : 14 - t; mode = 'i'; }   // 8 quadros, vai e volta
    const wk = R.gen + ':' + res;
    if (u._glW !== wk) { u._glW = wk; for (let i = 0; i < 8; i++) glBodySpr(u, res, i, 'i'); }   // já pede os quadros parados
    let s = glBodySpr(u, res, q, mode);
    if (!s && !(u._glS && u._glS.gen === R.gen)) s = glBodySpr(u, res, 0, 'i');                    // primeira pose (vem na tela de preparo)
    if (s) u._glS = s;
    else if (u._glS && u._glS.gen === R.gen) s = u._glS;                                           // enquanto a pose nova não chega, fica a anterior
    return s;
  }
  function glTypeDots(types, cx, y) {
    const w = types.length * 8;
    types.forEach((t, i) => { const x = cx - w / 2 + 4 + i * 8; GLR.circle(x, y, 3.45, '#000'); GLR.circle(x, y, 2.75, TYPE_COLOR[t]); });
  }
  function glUnit(u, opt = {}) {
    const R = GLR, S = spOf(u), sc = u.scale * u.capScale;
    const af = !u.moving && !u.breath && !u.hurt && !u.hop && !(u.capScale < 1) ? frameNo & (lite ? ~15 : ~7) : frameNo;
    const bobT = !lite && opt.noShadow === undefined && scene === 'battle' ? Math.sin(frameNo * 0.08 + u.uid * 1.7) * 0.7 : 0;
    const flash = u.hurt > 0 && (u.hurt % 6 < 3);
    const col = opt.color || sideColor(u);
    const hop = u.hop ? -Math.abs(Math.sin(u.hop * 0.18)) * 16 : 0, lift = u.lift || 0;
    R.push(); R.tr(u.x, u.y + hop - lift + bobT);
    const sy = surf(u.x, u.y - 2);
    if (!opt.noShadow && sy <= WATER) R.ellipse(0, sy - u.y + 0.5 + lift, 11 * u.scale, 2.6 * u.scale, '#000', 0.25);
    if (u.shield > 0 && u.capScale > 0.5) {
      const r = S.hitR * u.scale * 1.75 + 4, cy = -S.hitY * u.scale;
      R.circle(0, cy, r, '#8fe0ff', 0.13); R.ring(0, cy, r, 1.8, '#bff3ff', 0.55 + 0.3 * Math.sin(af * 0.12));
    }
    const body = glBody(u);
    if (body) { R.push(); if (u.tilt && !u.flying) R.rot(u.tilt); R.sc(u.face * sc, sc); R.spr(body, u.invis > 0 ? 0.3 : flash ? 0.45 : 1); R.pop(); }
    if (spOf(u).escolta && u.capScale > 0.5 && !beesOut(u)) {
      const bs = R.svg('pj|bee', PJ.bee[0], PJ.bee[1], R.res * 2);
      if (bs) for (let i = 0; i < spOf(u).escolta; i++) { const q = escortPos(u, i); R.push(); R.tr(q.x, q.y + Math.sin(frameNo * 0.6 + i) * 0.8); R.sc(q.dir * 1.25 * u.scale, 1.25 * u.scale); R.spr(bs); R.pop(); }
    }
    if (u.sh && u.capScale > 0.5) {
      for (const [x, y, s, ph] of [[-S.hitR * u.scale * 0.8, -S.hitY * u.scale - 6, 1.2, u.blinkOff], [S.hitR * u.scale * 0.9, -S.hitY * u.scale + 8, 0.9, u.blinkOff + 2], [0, -S.h * u.scale * 0.8, 1, u.blinkOff + 4]]) {
        const k = Math.max(0, Math.sin(af * 0.09 + ph)); if (k >= 0.05) R.star(x, y, s * k, k);
      }
    }
    if (u.status && u.capScale >= 0.5) {
      const y = -S.h * u.scale * 0.55 + Math.sin(aF() * 0.15) * 1.5, x = -S.hitR * u.scale - 8;
      const c2 = { burn: '#ff7a1a', poison: '#b45ac8', freeze: '#bfeaf6', sleep: '#c8d8ff', para: '#ffe96a' }[u.status] || '#fff';
      const ch = { burn: '🔥', poison: '☠', freeze: '❄', sleep: 'Z', para: '⚡' }[u.status] || '';
      R.circle(x, y, 6.5, '#000', 0.55); R.ring(x, y, 6.5, 1.4, c2); R.text(ch, x, y + 3.4, { size: 9, fill: c2 });
    }
    if (u.webbed || u.stuck) {
      const s = R.svg('web', `<g stroke="#fff" stroke-width="1" fill="rgba(255,255,255,.18)"><circle r="15"/><circle r="8"/><path d="M-15,0H15M0,-15V15M-10.6,-10.6L10.6,10.6M10.6,-10.6L-10.6,10.6" stroke-width=".8"/></g>`, [-17, -17, 34, 34], R.res * u.scale);
      if (s) { R.push(); R.tr(0, -S.hitY * u.scale); R.sc(u.scale); R.spr(s, 0.9); R.pop(); }
    }
    if (!opt.noLabel && u.capScale > 0.5) {
      const ly = -(S.h * u.scale + 12);
      R.push(); R.tr(0, ly);
      if (opt.extraText) R.text(opt.extraText.t, 0, opt.extraText.y, opt.extraText.o);
      const parts = [{ t: (u.sh ? '✨' : '') + u.name, fill: '#fff' }];
      if (isVar(u)) parts.push({ t: stars(u.mvs), fill: '#ffd34d', dx: 2 });
      R.text(parts, 0, 0, { size: 10.5, fill: '#fff', stroke: '#000', sw: 0.6 });
      glTypeDots(S.types, 0, -12);
      if (!opt.noBar) {
        const hp = clamp(u.hp / u.maxhp, 0, 1);
        R.pill(-15, 3, 30, 5.5, '#000', 0.6); R.pill(-14, 4, 28 * hp, 3.5, col);
      }
      if (u.webbed || u.stuck) { R.ring(21, -2, 4.5, 1, '#fff'); R.ring(21, -2, 2, 1, '#fff'); R.line(16, -2, 26, -2, 0.7, '#fff', 1, false); R.line(21, -7, 21, 3, 0.7, '#fff', 1, false); }
      R.pop();
    }
    if (opt.weak) {
      const bounce = Math.sin(aF() * 0.2) * 2.5;
      if (ORIG) { const s = R.svg('egg|' + u.sp, eggSvg(eggCol(u.sp)), [-8, -17, 16, 18], R.res); if (s) { R.push(); R.tr(0, -(S.h * u.scale + 30) + bounce); R.sc(0.8); R.spr(s); R.pop(); } }
      else { const s = R.svg('ballIcon', Art.ball(6, 0), [-7.5, -7.5, 15, 15], R.res);
      if (s) { R.push(); R.tr(0, -(S.h * u.scale + 36) + bounce); R.spr(s); R.pop(); } }
      if (ballMode) R.text(Math.round(captureChance(u) * 100) + '%', 0, -(S.h * u.scale + 46), { size: 12, fill: '#ffd34d', stroke: '#000', sw: 0.7 });
    }
    if (opt.arrow) {
      const y = -(S.h * u.scale + 34) + Math.sin(aF() * 0.15) * 3;
      R.tri(-7.2, y - 0.9, 7.2, y - 0.9, 0, y + 10.2, '#fff'); R.tri(-6, y, 6, y, 0, y + 8, opt.arrow);
    }
    R.pop();
  }

  const PJ = {     // cabeças dos tiros: desenhos fixos (girados/escalados na hora) — [svg, área]
    poison: [`<path d="M-8,-3 L9,0 L-8,3 L-4,0 Z" fill="#b45ac8" stroke="#592468" stroke-width="1" stroke-linejoin="round"/><path d="M-5,-1 L5,0" fill="none" stroke="#f0cef6" stroke-width=".8"/>`, [-10, -5, 21, 10]],
    ice: [`<path d="M-9,0 L-2,-4.4 L10,0 L-2,4.4 Z" fill="#bfeaf6" stroke="#4a8ab0" stroke-width="1.2" stroke-linejoin="round"/><path d="M-5,0 L6,0" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`, [-11, -6, 23, 12]],
    punch: [`<circle r="6.6" fill="#f2c9a0" stroke="#7a3a1c" stroke-width="1.3"/><path d="M-1,-5 L-1,5 M2.4,-4.4 L2.4,4.4" stroke="#7a3a1c" stroke-width=".9" opacity=".7"/><path d="M-12,-3 L-7,-2 M-13,0 L-7,0 M-12,3 L-7,2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`, [-14, -8, 22, 16]],
    leaf: [`<path d="M-8,0 Q0,-6 8,0 Q0,6 -8,0 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width=".8"/><line x1="-6" y1="0" x2="6" y2="0" stroke="#1d4a2a" stroke-width=".7"/>`, [-9, -5, 18, 10]],
    gust: [`<g opacity=".92"><path d="M-12,-5 Q4,-12 10,0 Q4,-5 -12,-2 Z" fill="#fff" stroke="#9ab8e8" stroke-width=".9"/><path d="M-12,5 Q4,12 10,0 Q4,5 -12,2 Z" fill="#e3eeff" stroke="#9ab8e8" stroke-width=".9"/></g>`, [-13, -10, 24, 20]],
    rock: [`<path d="M-8,-3 L-3,-8 L5,-7 L9,-1 L6,6 L-3,8 L-9,3 Z" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.3" stroke-linejoin="round"/><path d="M-4,-2 L1,-4 M0,3 L4,1" stroke="#4a4a56" stroke-width=".9" stroke-linecap="round"/>`, [-10, -10, 20, 20]],
    normal: [`<path d="M0,-7 L2,-2 L7,-2 L3,1.5 L4.5,7 L0,3.5 L-4.5,7 L-3,1.5 L-7,-2 L-2,-2 Z" fill="#fff6c8" stroke="#c98a2a" stroke-width="1" stroke-linejoin="round"/>`, [-8, -8, 16, 16]],
    web: [`<g stroke="#fff" stroke-width="1" fill="rgba(255,255,255,.35)"><circle r="6"/><circle r="3"/><path d="M-6,0H6M0,-6V6M-4.3,-4.3L4.3,4.3M4.3,-4.3L-4.3,4.3" stroke-width=".8"/></g>`, [-7, -7, 14, 14]],
    ghost: [`<circle r="6" fill="#2a1848" stroke="#b496e0" stroke-width="1.4"/><circle cx="-1.6" cy="-1.8" r="1.6" fill="#e0d0f8" opacity=".8"/>`, [-7.5, -7.5, 15, 15]],
    water: [`<circle r="5.2" fill="#7fd0ff" stroke="#1f6fb0" stroke-width="1"/><circle cx="-1.6" cy="-1.6" r="1.7" fill="#fff"/>`, [-6.5, -6.5, 13, 13]],
    psy: [`<circle r="6" fill="none" stroke="#ffc2e8" stroke-width="1.4" stroke-dasharray="4 3"/>`, [-7.5, -7.5, 15, 15]],
    snd0: [`<path d="M-2,-9 Q8,0 -2,9" fill="none" stroke="#bfe9ff" stroke-width="2.4" stroke-linecap="round"/>`, [-4, -11, 10, 22]],
    snd1: [`<path d="M3,-7 Q11,0 3,7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`, [1, -9, 10, 18]],
    snd2: [`<path d="M9,-5 Q14,0 9,5" fill="none" stroke="#ff9ad0" stroke-width="2" stroke-linecap="round" opacity=".8"/>`, [7, -7, 9, 14]],
    fire: [`<circle r="8" fill="url(#fireball)"/>`, [-8, -8, 16, 16]],
    dragon: [`<circle r="8" fill="url(#dragFire)"/>`, [-8, -8, 16, 16]],
    zap: [`<circle r="8" fill="url(#zap)"/>`, [-8, -8, 16, 16]],
    net: [NET_SVG, [-10, -10, 20, 20]],
    bone: [BONE_SVG, [-10, -5, 20, 10]],
    crumb: [CRUMB_SVG, [-9, -8, 18, 15]],
    dung: [DUNG_SVG, [-8, -8, 16, 16]],
    egg: [EGG_P, [-6.5, -7.5, 13, 15]],
    roach: [ROACH_P, [-10, -10, 26, 16]],
    spike: [SPIKE_P, [-8, -2.5, 16, 5]],
    tongue: [TONGUE_P, [-6, -6, 12, 12]],
    poop: [POOP_P, [-6, -6, 12, 12]],
    bee: [MS.BEE_MINI || '<circle r="3" fill="#f6c428"/>', [-5, -7, 11, 10]]
  };
  function glPj(name, x, y, rot, sc = 1, a = 1) {
    const d = PJ[name], R = GLR, s = R.svg('pj|' + name, d[0], d[1], R.res * Math.max(1, sc) * 1.5);
    if (!s) return;
    R.push(); R.tr(x, y); if (rot) R.rot(rot); if (sc !== 1) R.sc(sc); R.spr(s, a); R.pop();
  }
  function glTrail(p, r0, r1, col, a0, col2) {
    const n = p.trail.length;
    p.trail.forEach((tp, i) => { const k = (i + 1) / n; GLR.circle(tp.x, tp.y, r0 + r1 * k, col2 && k <= 0.5 ? col2 : col, k * a0); });
  }
  function glProj(p) {
    if (p.under) return;
    const R = GLR, st = p.wp.style, deg = Math.atan2(p.vy, p.vx);
    if (p.wk === 'ball') {
      glTrail(p, 1, 2, '#fff', 0.4);
      const col = BALLS[p.bt || 'ball'].col, s = R.svg('ball|' + col, Art.ball(6, 0, 0, col), [-7.5, -7.5, 15, 15], R.res * 1.5);
      if (s) { R.push(); R.tr(p.x, p.y); R.rot(frameNo * 14 * Math.PI / 180); R.spr(s); R.pop(); }
      return;
    }
    switch (st) {
      case 'fire': case 'dragon': {
        const c1 = st === 'fire' ? ['#ffb020', '#ff5a1f'] : ['#b79cff', '#6a3cff'];
        glTrail(p, 2, 5, c1[0], 0.7, c1[1]);
        glPj(st, p.x, p.y, 0, ((st === 'fire' ? 7 : 8.5) + Math.sin(frameNo * 0.6) * 1.2) / 8); return;
      }
      case 'poison': glTrail(p, 1, 2, '#c783e4', 0.55); glPj('poison', p.x, p.y, deg); return;
      case 'ice': glTrail(p, 1, 2.4, '#dff4ff', 0.55); glPj('ice', p.x, p.y, deg); return;
      case 'ghost': {
        glTrail(p, 2, 4, '#6a4a9a', 0.4);
        const k = 0.5 + 0.5 * Math.sin(frameNo * 0.4);
        R.circle(p.x, p.y, 8 + k * 1.4, '#8a6ac0', 0.35); glPj('ghost', p.x, p.y, 0); return;
      }
      case 'punch': glTrail(p, 1.5, 3, '#fff0c8', 0.5); glPj('punch', p.x, p.y, deg); return;
      case 'leaf': glPj('leaf', p.x, p.y, deg + Math.sin(frameNo * 0.4 + p.spin) * 25 * Math.PI / 180); return;
      case 'water': glTrail(p, 1.5, 2, '#bfe9ff', 0.6); glPj('water', p.x, p.y, 0); return;
      case 'normal': glTrail(p, 1.5, 3, '#fff', 0.5); glPj('normal', p.x, p.y, (frameNo * 12 % 360) * Math.PI / 180); return;
      case 'gust': glPj('gust', p.x, p.y, deg); return;
      case 'rock': {
        glTrail(p, 1.5, 3, '#c8b898', 0.4);
        const sz = p.wp.size || 1;
        glPj('rock', p.x, p.y, ((frameNo * (sz > 1.2 ? 5 : 9) + p.spin * 50) % 360) * Math.PI / 180, sz); return;
      }
      case 'psy': {
        glTrail(p, 1, 4, '#ff8ad0', 0.35);
        const a = frameNo * 0.3;
        R.circle(p.x, p.y, 9, '#ff8ad0', 0.25); glPj('psy', p.x, p.y, ((a * 57) % 360) * Math.PI / 180);
        R.circle(p.x, p.y, 3.4, '#fff'); R.circle(p.x + Math.cos(a) * 7, p.y + Math.sin(a) * 7, 1.6, '#b78aff'); return;
      }
      case 'sound': {
        const k = (frameNo % 14) / 14;
        R.push(); R.tr(p.x, p.y); R.rot(deg);
        glPj('snd0', k * -10, 0, 0, 1, 1 - k); glPj('snd1', 0, 0, 0); glPj('snd2', 0, 0, 0);
        R.pop(); return;
      }
      case 'powder': {
        R.circle(p.x, p.y, 10, '#d8c8ff', 0.22);
        for (let i = 0; i < 7; i++) { const a = frameNo * 0.12 + i * 0.9, r = 3 + (i % 3) * 3; R.circle(p.x + Math.cos(a) * r, p.y + Math.sin(a * 1.3) * r, 1.2 + (i % 2), i % 2 ? '#e8d8ff' : '#b99cff', 0.85); }
        return;
      }
      case 'web': glTrail(p, 0.8, 1.6, '#fff', 0.5); glPj('web', p.x, p.y, (frameNo * 5 % 360) * Math.PI / 180); return;
      case 'net': glTrail(p, 0.6, 1.2, '#e8f4ff', 0.4); glPj('net', p.x, p.y, frameNo * 0.15, 1.15); return;
      case 'bone': glTrail(p, 1, 1.6, '#fff6e0', 0.35); glPj('bone', p.x, p.y, frameNo * 0.3, 1.1); return;
      case 'crumb': glTrail(p, 1, 2, '#f0d090', 0.35); glPj('crumb', p.x, p.y, frameNo * 0.12, 1.15); return;
      case 'dung': glTrail(p, 1.2, 2, '#8a6038', 0.35); glPj('dung', p.x, p.y, frameNo * 0.2, 1.1); return;
      case 'egg': glTrail(p, 1, 1.4, '#fff6e0', 0.3); glPj('egg', p.x, p.y, frameNo * 0.25, 1.1); return;
      case 'roach': glPj('roach', p.x, p.y, deg + Math.sin(frameNo * 0.6) * 0.15, 1.1); return;
      case 'spike': glPj('spike', p.x, p.y, deg, 1.1); return;
      case 'tongue': { const o = p.ownerUnit; if (o && o.alive) { const m = mouthAt(o, o.face, false); R.line(m.x, m.y, p.x, p.y, 2.6, '#ff6a8a', 0.95); } glPj('tongue', p.x, p.y, 0, 1.1); return; }
      case 'poop': glPj('poop', p.x, p.y, frameNo * 0.1, (p.wp.size || 1) * 1.15); return;
      case 'bee': glTrail(p, 0.5, 0.8, '#fff6c0', 0.35); R.push(); R.tr(p.x, p.y); if (p.vx < 0) R.sc(-1, 1); glPj('bee', 0, Math.sin(frameNo * 0.5 + p.spin) * 1.5, 0, 1.5); R.pop(); return;
      default: {
        const pts = p.trail.concat([{ x: p.x, y: p.y }]).map((tp, i) => [tp.x, tp.y + (i % 2 ? 3 : -3)]);
        R.poly(pts, 4.5, '#ffd000', 0.45); R.poly(pts, 2, '#fffbd0');
        glPj('zap', p.x, p.y, 0, 4.5 / 8);
      }
    }
  }

  // clima em tela cheia (por cima do mundo, por baixo do painel)
  function glWx(w, a) {
    const R = GLR; if (!w || a <= 0.01) return;
    R.push(); R.alpha(a);
    if (w === 'rain') {
      R.rect(0, 0, 800, 500, '#0a1a33', 0.3);
      if (!lite) {
        const sl = -wind * 0.1 - 0.12;
        for (let j = 0; j < 3; j++) {
          const off = (frameNo * WX_SP.rain[j]) % 540, ox = off * -sl, wd = j === 2 ? 1.6 : 1.1, op = 0.3 + j * 0.08;
          for (let i = 0; i < 22; i++) {
            const y0 = ((i * 53 + j * 177) % 540) - 20, x0 = ((i * 131.7 + j * 211) % 880) - 40;
            for (const y of [y0, y0 - 540]) { const yy = y + off; if (yy < -20 || yy > 520) continue; const x = x0 - y * sl + ox; R.line(x, yy, x + sl * 16, yy + 16, wd, '#cfe9ff', op); }
          }
        }
      }
    } else if (w === 'sun') {
      R.rect(0, 0, 800, 500, '#ffb347', 0.09);
      R.circle(690, 52, 190, '#fff2b0', 0.05); R.circle(690, 52, 120, '#fff2b0', 0.07); R.circle(690, 52, 64, '#fff6c8', 0.14);
      const r0 = lite ? 0 : frameNo * 0.15 * Math.PI / 180;
      for (let i = 0; i < 10; i++) {
        const a = r0 + i * 36 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        const P = (x, y) => [690 + x * c - y * s, 52 + x * s + y * c];
        const p1 = P(-5, -70), p2 = P(0, -260), p3 = P(5, -70);
        R.tri(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], '#fff6c8', 0.07);
      }
      R.circle(560, 150, 14, '#fff6c8', 0.07); R.circle(470, 215, 22, '#ffd9a0', 0.06); R.circle(390, 270, 10, '#fff6c8', 0.08);
    } else if (w === 'storm') {
      R.rect(0, 0, 800, 500, '#0c1030', 0.4);
      if (bolt) { const o = Math.max(0, 1 - bolt.t / 12); R.poly(bolt.pts, 9, '#ffe96a', o * 0.35); R.poly(bolt.pts, 3, '#fff', o); }
    } else if (w === 'snow') {
      R.rect(0, 0, 800, 500, '#bcd8f0', 0.14);
      if (!lite) for (let j = 0; j < 3; j++) {
        const off = (frameNo * WX_SP.snow[j]) % 540, dx = Math.sin(frameNo * 0.03 + j * 2) * 14 - wind * off * 0.04, r = 1.2 + j * 0.7, op = 0.55 + j * 0.12;
        for (let i = 0; i < 24; i++) {
          const y0 = ((i * 71 + j * 133) % 540) - 20, x0 = ((i * 117.3 + j * 97) % 840) - 20;
          for (const y of [y0, y0 - 540]) { const yy = y + off; if (yy < -5 || yy > 505) continue; R.circle(x0 - wind * y * 0.04 + dx, yy, r, '#fff', op); }
        }
      }
    }
    R.pop();
  }

  const CLOUD_SVG = `<g opacity=".92"><ellipse cx="0" cy="8" rx="46" ry="10" fill="#d9e6f2"/><circle cx="-22" cy="0" r="16" fill="#fff"/><circle cx="0" cy="-9" r="22" fill="#fff"/><circle cx="24" cy="0" r="15" fill="#fff"/><rect x="-38" y="0" width="78" height="12" rx="6" fill="#fff"/></g>`;
  function glWater(front) {
    const R = GLR, key = front ? 'seaF' : 'seaB', top = front ? 476.5 : 469, span = H - top;
    let px = -40, py = 0;
    for (let x = -40; x <= W + 40; x += 10) {
      const y = front ? 481 + 3 * Math.sin(x * 0.045 - frameNo * 0.05) + 1.5 * Math.sin(x * 0.11 + frameNo * 0.08) : 472 + 3 * Math.sin(x * 0.03 + frameNo * 0.04);
      if (x > -40) R.quad4(key, px, py, x, y, x, H + 30, px, H + 30, (py - top) / span, (y - top) / span, 1 + 30 / span);
      px = x; py = y;
    }
  }

  // tudo pronto? fotos do cenário, terreno e a primeira pose de cada Pokémon
  function glCheckLoad(inBattle) {
    const R = GLR, now = performance.now();
    if (!glLoadAt) glLoadAt = now;
    let need = 0, got = 0;
    for (const [name] of GL_BG) { need++; if (!glBgDirty && glSnap[name] && glSnap[name].ok) got++; }
    need += 4; if (glTerrOk && !glFullT && !glTerrBusy) got += 4;
    for (const u of units) {
      if (u.hidden || (inBattle && !u.alive)) continue;
      need++; if (glBodySpr(u, glBodyRes(u), 0, 'i')) got++;          // só a primeira pose; as outras chegam com o jogo rodando
    }
    glLoadProg = need ? got / need : 1;
    if (got >= need || now - glLoadAt > 8000) { glLoading = false; glLoadFade = 1; for (const k in PJ) R.svg('pj|' + k, PJ[k][0], PJ[k][1], R.res * 1.5); }
  }
  function loadingSvg() {
    const a = glLoading ? 1 : glLoadFade, k = glLoading ? glLoadProg : 1;
    return `<g opacity="${a.toFixed(2)}"><rect width="800" height="500" fill="#0d1b2a"/>
      <g transform="translate(400 210) rotate(${(frameNo * 6) % 360})">${Art.ball(26, 0)}</g>
      <text x="400" y="290" text-anchor="middle" font-size="24" font-weight="800" fill="#fff">${scene === 'battle' ? 'Preparando a batalha…' : 'Preparando…'}</text>
      <rect x="250" y="312" width="300" height="14" rx="7" fill="#000" opacity=".5"/>
      <rect x="252" y="314" width="${f1(296 * k)}" height="10" rx="5" fill="#ffd34d"/>
      <text x="400" y="352" text-anchor="middle" font-size="13" fill="#bfe3ff">desenhando cenário e ${ORIG ? 'monstrinhos' : 'Pokémon'} na placa de vídeo</text></g>`;
  }
  // ---------- painel no WebGL ----------
  // o painel (vez, tempo, vento, ordem, minimapa) vira uma imagem refeita só quando um texto dele muda;
  // a barra de força, o retângulo do minimapa e as mensagens são desenhados direto, todo quadro
  let glHudWant = '', glHudHave = null, glHudBusy = false, glHudOk = false;
  const HUD_H = 240;
  function glHudSnap() {
    if (glHudBusy || glHudWant === glHudHave) return;
    const str = glHudWant; glHudBusy = true;
    if (!str) { glHudHave = str; glHudOk = false; glHudBusy = false; return; }
    const w = Math.round(800 * glP), h = Math.round(HUD_H * glP);
    const src = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 800 ${HUD_H}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">${defsFor(str)}${str}</svg>`;
    const im = new Image();
    im.onload = () => {
      glHudBusy = false; if (!GLR) return;
      try { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); GLR.setTex('hud', c); c.width = 0; glHudOk = true; glHudHave = str; } catch (_) { glHudHave = str; }
    };
    im.onerror = () => { glHudBusy = false; glHudHave = str; };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  }
  function glBottomBar() {
    if (scene !== 'battle' || !(state === 'aim' || state === 'ai') || !teams[turnTeam]) return;
    const u = activeUnit(); if (!u || !u.alive) return;
    const R = GLR, el = elevOf(u), [wlo, whi] = aimWindow(u);
    const cx = 186, cy = 474, r = 22, P = d => [cx + Math.cos(d * Math.PI / 180) * r, cy - Math.sin(d * Math.PI / 180) * r];
    const w0 = Math.max(-40, wlo), w1 = Math.min(220, whi), pe = P(el);
    const bx = 216, bw = 312, py = 446, my = 476;
    R.rrect(152, 434, 388, 58, 12, '#0d1b2a', 0.78);
    R.line(cx - r - 3, cy, cx + r + 3, cy, 1, '#8aa0c8', 1, false);
    for (let i = 0; i < 12; i++) { const a = P(i * 15), b = P((i + 1) * 15); R.line(a[0], a[1], b[0], b[1], 1, '#8aa0c8', 0.5, false); }
    R.wedge(cx, cy, r, w0, w1, '#6ad0ff', 0.28);
    { const p0 = P(w0), p1 = P(w1); R.line(cx, cy, p0[0], p0[1], 1, '#6ad0ff', 0.7, false); R.line(cx, cy, p1[0], p1[1], 1, '#6ad0ff', 0.7, false); }
    R.line(cx, cy, pe[0], pe[1], 2.6, '#ffb43c');
    R.text(Math.round(el) + '°', cx, cy + 13, { size: 11, fill: '#fff' });
    R.text(`${Math.round(wlo)}°–${Math.round(whi)}°`, cx, cy - r - 4, { size: 7.5, fill: '#bfe3ff', weight: 'normal' });
    R.text('FORÇA', bx, py - 3, { size: 8, fill: '#bfe3ff', weight: 'normal', anchor: 'start', ls: 1.2 });
    R.pill(bx, py, bw, 12, '#000', 0.55);
    if (charging) { const pw = Math.max(0, power / 100 * (bw - 2)); if (pw > 0) { R.hgrad(bx + 1 + 5, py + 1, Math.max(0, pw - 10), 10, ['#5ad16a', '#ffd34d', '#ff4d3a']); R.circle(bx + 6, py + 6, 5, '#5ad16a'); R.circle(bx + 1 + Math.max(5, pw - 5), py + 6, 5, power > 70 ? '#ff6a3a' : power > 40 ? '#ffd34d' : '#5ad16a'); } }
    for (let i = 1; i < 10; i++) R.line(bx + bw * i / 10, py, bx + bw * i / 10, py + (i === 5 ? 12 : 6), 1, '#fff', 0.25, false);
    const lp = u.lastPow;
    if (lp !== null && lp !== undefined) { const lx = bx + bw * lp / 100; R.tri(lx, py - 1, lx - 4, py - 7, lx + 4, py - 7, '#fff'); R.text('último', Math.min(bx + bw - 30, lx + 6), py - 2, { size: 7.5, fill: '#fff', weight: 'normal', anchor: 'start' }, 0.8); }
    R.text('MOVER', bx, my - 3, { size: 8, fill: '#bfe3ff', weight: 'normal', anchor: 'start', ls: 1.2 });
    R.pill(bx + 44, my - 9, bw - 44, 6, '#000', 0.55);
    R.pill(bx + 45, my - 8, Math.max(0, walkBudget / walkMax()) * (bw - 46), 4, '#9be36a');
    if (!teams[turnTeam].ai) R.text('P passa a vez · golpe forte = mais atraso', bx + bw, my + 12, { size: 8, fill: '#bfe3ff', weight: 'normal', anchor: 'end' });
  }
  function glUi() {
    const R = GLR;
    glHudSnap();
    if (glHudOk && glHudWant) { const T = R.tex('hud'); if (T) R.img('hud', 0, 0, T.w, T.h, 0, 0, 800, HUD_H); }
    if (mmShown && scene === 'battle') { const k = MM.w / W, vw = VW / cam.z, vx = clamp(cam.x - vw / 2, 0, W - vw); R.rrect(MM.x + vx * k, MM.y + 1, vw * k, MM.h - 2, 3, '#fff', 0.1); R.line(MM.x + vx * k, MM.y + 1, MM.x + vx * k + vw * k, MM.y + 1, 1.4, '#fff', 1, false); R.line(MM.x + vx * k, MM.y + MM.h - 1, MM.x + vx * k + vw * k, MM.y + MM.h - 1, 1.4, '#fff', 1, false); R.line(MM.x + vx * k, MM.y + 1, MM.x + vx * k, MM.y + MM.h - 1, 1.4, '#fff', 1, false); R.line(MM.x + vx * k + vw * k, MM.y + 1, MM.x + vx * k + vw * k, MM.y + MM.h - 1, 1.4, '#fff', 1, false); }
    glBottomBar();
    if (msg) { const w = Math.min(780, msg.length * 12.5 + 40), my = state === 'guest' ? 84 : 206; R.rrect(400 - w / 2, my, w, 44, 14, '#000', 0.45); R.text(msg, 400, my + 29, { size: 22, fill: '#fff' }); }
  }
  function renderGL(act, inBattle) {
    const R = GLR;
    if (R.gen !== glGen) {             // o atlas encheu e recomeçou? baixa a resolução das poses para não ficar refazendo (piscar)
      const now = performance.now();
      if (glGen && !glResetOk && now - glGenAt < 30000) glResK = Math.max(0.45, glResK * 0.75);
      glGen = R.gen; glGenAt = now; glResetOk = false;
    }
    R.res = glP * (noZoom() ? 1 : 1.6) * glResK;
    glSchedule();
    if (glLoading) glCheckLoad(inBattle);
    else if (glLoadFade > 0) glLoadFade = Math.max(0, glLoadFade - 0.07);
    const sky = THEMES[themeKey].sky, sc0 = R.parseCol(sky[1] || '#8cc4ea');
    R.begin(sc0[0], sc0[1], sc0[2]);
    // céu e nuvens (presos à tela)
    R.setBase(1, 0, 0);
    glDrawSnap('sky');
    const cs = R.svg('cloud', CLOUD_SVG, [-48, -33, 96, 53], glP);
    if (cs) { const op = +THEMES[themeKey].clouds || 0; for (const c of clouds) { R.push(); R.tr(c.x, c.y); R.sc(c.s); R.spr(cs, op); R.pop(); } }
    // montanhas e faixa do fundo (parallax)
    glLayer(0.25); glDrawSnap('far');
    glLayer(0.5); glDrawSnap('near');
    glLayer(0.65); glDrawSnap('mid');
    // mundo
    glLayer(1);
    glWater(false);
    if (glShader()) glDrawTerrain();
    else if (glTerrOk && glTerr) for (let i = 0; i < glTerr.n; i++) {
      const T = R.tex('terr' + i); if (T) R.img('terr' + i, 0, 0, T.w, T.h, -40 + i * glTerr.tw / glTerr.sx, -20, T.w / glTerr.sx, T.h / glTerr.sy);
    }
    if (scene === 'battle') for (const p of pickups) {
      const B = BALLS[p.type], y = gy(p.x), bob = lite ? 0 : Math.sin(frameNo * 0.08 + p.ph) * 3, big = p.type !== 'ball';
      R.push(); R.tr(p.x, y + bob);
      R.ellipse(0, 1, 6, 1.8, '#000', 0.25);
      R.circle(0, -12, 12.5, B.col, lite ? 0.25 : 0.25 + 0.09 * Math.sin(frameNo * 0.075));
      const s = R.svg('pk|' + p.type, () => `<g transform="translate(0 -12)">${Art.ball(big ? 7.5 : 6.5, big ? 20 : 0, 0, B.col)}</g>
        <path transform="translate(0 -30)" d="M-3.5,0 L3.5,0 L0,5 Z" fill="${big ? B.col : '#fff'}" stroke="#000" stroke-width=".8" stroke-linejoin="round"/>`, [-10, -32, 20, 30], R.res * 1.2);
      if (s) R.spr(s);
      if (big) R.text(p.type === 'great' ? 'GREAT' : 'ULTRA', 0, -35, { size: 8.5, fill: B.col, stroke: '#000', sw: 0.6 });
      R.pop();
    }
    // ovos no chão (versão original): balançam e têm uma setinha pulando em cima
    for (const e of eggs) {
      const s = R.svg('egg|' + e.sp, eggSvg(e.col), [-8, -17, 16, 18], R.res);
      const wob = Math.sin(frameNo * 0.25 + e.id) * (e.t % 120 < 30 ? 0.25 : 0.04);
      R.push(); R.tr(e.x, e.y); R.ellipse(0, 0.5, 6, 1.8, '#000', 0.25); R.circle(0, -10, 14, e.col, 0.18 + 0.08 * Math.sin(frameNo * 0.1));
      R.rot(wob); R.sc(1.35); if (s) R.spr(s); R.pop();
      const ay = e.y - 30 + Math.sin(frameNo * 0.15) * 3; R.tri(e.x - 4, ay, e.x + 4, ay, e.x, ay + 5, '#ffe27a');
    }
    for (const n of nets) {                        // rede fechando no ovo e voando até o dono
      const q = netPos(n), s = R.svg('egg|' + n.e.sp, eggSvg(n.e.col), [-8, -17, 16, 18], R.res);
      R.push(); R.tr(q.x, q.y + 8); R.sc(1.35 - q.k * 0.4); if (s) R.spr(s); R.pop();
      glPj('net', q.x, q.y, q.k * 6, 1.9 - q.close * 0.75);
    }
    for (const e of stageEggs) {                   // ovo guardado ao lado de quem pegou (até chocar)
      if (e.baby || !e.u || !e.u.alive) continue;
      const u = e.u, x = u.x - u.face * 12, y = u.y + Math.sin(frameNo * 0.12 + e.id) * 0.8;
      const s = R.svg('egg|' + e.sp, eggSvg(e.col), [-8, -17, 16, 18], R.res);
      R.push(); R.tr(x, y); R.rot(Math.sin(frameNo * 0.2) * (frameNo % 90 < 20 ? 0.2 : 0.03)); R.sc(0.95); if (s) R.spr(s); R.pop();
      glPj('net', x, y - 7, 0, 0.95, 0.75);
    }
    // mira
    if (inBattle && act && (state === 'aim' || (state === 'ai' && ai && ['aim', 'wait', 'charge'].includes(ai.phase)))) {
      const a = angle * Math.PI / 180, m = mouthAt(act, act.face, ballMode || netMode), x2 = m.x + Math.cos(a) * 46, y2 = m.y - Math.sin(a) * 46;
      const ac = netMode ? '#7fe0f0' : ballMode ? '#ffd34d' : '#ff4d4d';
      R.dashed(m.x, m.y, x2, y2, 2, 3, 5, '#fff', 0.85, true);
      R.ring(x2, y2, 6, 2, ac);
      R.line(x2 - 10, y2, x2 - 4, y2, 2, ac); R.line(x2 + 4, y2, x2 + 10, y2, 2, ac); R.line(x2, y2 - 10, x2, y2 - 4, 2, ac); R.line(x2, y2 + 4, x2, y2 + 10, 2, ac);
      R.text(Math.round(elevOf(act)) + '°', x2, y2 - 13, { size: 10, fill: '#fff', stroke: '#000', sw: 0.4 });
    }
    // Pokémon
    for (const u of units) {
      if (!u.alive && inBattle) continue;
      if (u.hidden) continue;
      if (!inBattle) { glUnit(u, { color: '#fff', noBar: true }); continue; }
      const isFoe = kind === 'campaign' && u.team >= 1;
      glUnit(u, {
        extraText: u.team === 2 ? { t: 'VISITANTE', y: -26, o: { size: 8.5, fill: GUEST_COL, stroke: '#000', sw: 0.5, ls: 1 } } : null,
        weak: isFoe && u.hp / u.maxhp <= WEAK && state !== 'capture',
        arrow: u === act && (state === 'aim' || state === 'ai') && !teams[turnTeam].ai ? teams[u.team].color : null
      });
    }
    // sombra dos tiros, tiros, captura
    if (!lite) for (const p of projs) {
      if (p.x < 0 || p.x >= W) continue;
      const g = gy(p.x), k = clamp(1 - Math.max(0, g - p.y) / 260, 0.15, 1);
      R.ellipse(p.x, g, 8 * k + 2, 2.4 * k + 0.6, '#000', 0.35 * k);
    }
    for (const p of projs) glProj(p);
    if (cap) {
      const c = cap;
      if (c.t <= 22) R.circle(c.x, c.y, 6 + c.t * 1.2, '#fff', 1 - c.t / 22);
      const op = Math.round((c.open || 0) * 10) / 10, col = c.col || '#e63b3b';
      const s = R.svg('cap|' + col + '|' + op, Art.ball(8, 0, op, col), [-12, -14, 24, 26], R.res * 1.8);
      if (s) { R.push(); R.tr(c.x, c.by); R.rot(c.rot * Math.PI / 180); R.spr(s, c.alpha); R.pop(); }
      if (c.stars) for (let i = 0; i < 3; i++) {
        const a = frameNo * 0.08 + i * 2.1;
        R.text('★', c.x + Math.cos(a) * 14, c.by - 16 - Math.abs(Math.sin(a)) * 8, { size: 12, fill: '#ffd34d', weight: 'normal' }, c.alpha);
      }
    }
    // partículas
    for (const p of parts) {
      const k = p.life / p.max, op = Math.min(1, k * 1.5);
      if (p.kind === 'smoke') R.circle(p.x, p.y, p.r + (1 - k) * 10, p.col, k * 0.45);
      else if (p.kind === 'leaf') { R.push(); R.tr(p.x, p.y); R.rot(((frameNo * 8 + p.max * 7) % 360) * Math.PI / 180); R.ellipse(0, 0, p.r, p.r * 0.5, p.col, op); R.pop(); }
      else R.circle(p.x, p.y, p.r, p.col, op);
    }
    // efeitos: aviso do raio, raios do céu, hiper raio, corrente elétrica, explosões
    for (const b of bolts) {
      if (b.t >= 0 || (frameNo >> 3) % 2) continue;
      const sy = Math.min(surf(b.x, 0), WATER);
      R.dashed(b.x, sy - 220, b.x, sy, 2, 6, 6, '#fff27a', 0.8); R.ring(b.x, sy, 14, 2, '#fff27a');
      R.text('⚡', b.x, sy - 226, { size: 16, weight: 'normal' });
    }
    for (const f of fx) {
      const k = f.t / f.max;
      if (f.sky) { R.poly(f.pts, 9, '#ffd000', 0.45 * (1 - k)); R.poly(f.pts, 3, '#fffbe0', 1 - k); continue; }
      if (f.beam) {
        const w = 16 * (1 - k * 0.7);
        R.line(f.x, f.y, f.x2, f.y2, w + 10, '#ffb43c', 0.35 * (1 - k)); R.line(f.x, f.y, f.x2, f.y2, w, '#fff3c0', 0.9 * (1 - k)); R.line(f.x, f.y, f.x2, f.y2, w * 0.35, '#fff', 1 - k);
        continue;
      }
      if (f.bolt) {
        const n = 6, pts = [[f.x, f.y]];
        for (let i = 1; i < n; i++) { const t = i / n; pts.push([f.x + (f.x2 - f.x) * t + ((i * 7 + f.t) % 5 - 2) * 3, f.y + (f.y2 - f.y) * t + ((i * 5 + f.t) % 5 - 2) * 3]); }
        pts.push([f.x2, f.y2]);
        R.poly(pts, 5, '#ffd000', 0.5 * (1 - k)); R.poly(pts, 2, '#fffbd0', 1 - k);
        continue;
      }
      const r = f.r * Math.min(1, k * 1.6);
      if (f.fill && f.fill.startsWith('url(')) {
        const s = R.svg('fx|' + f.fill, `<circle r="50" fill="${f.fill}"/>`, [-50, -50, 100, 100], Math.min(3, R.res * 0.9));
        if (s) { R.push(); R.tr(f.x, f.y); R.sc(r / 50); R.spr(s, 1 - k); R.pop(); }
        else R.circle(f.x, f.y, r, '#ffb347', 1 - k);
      } else R.circle(f.x, f.y, r, f.fill, 1 - k);
      R.ring(f.x, f.y, f.r * k * 1.4, 3 * (1 - k), '#fff', 0.8 * (1 - k));
    }
    // brilhos somados à luz (fogo, raios, explosões): ficam bonitos e custam quase nada na placa de vídeo
    if (!lite) {
      R.add(true);
      for (const p of projs) { if (p.under || p.wk === 'ball') continue; const c = PROJ_LIGHT[p.wp.style]; if (c) R.glow(p.x, p.y, 22 + Math.sin(frameNo * 0.5) * 2, c, 0.55); }
      for (const f of fx) {
        const k = 1 - f.t / f.max; if (k <= 0) continue;
        if (f.sky) { const q = f.pts[f.pts.length - 1]; R.glow(q[0], q[1], 70, '#fff3a0', 0.8 * k); for (const pt of f.pts) R.glow(pt[0], pt[1], 22, '#ffe96a', 0.25 * k); }
        else if (f.beam) { const n = 8; for (let i = 0; i <= n; i++) R.glow(f.x + (f.x2 - f.x) * i / n, f.y + (f.y2 - f.y) * i / n, 34, '#ffc070', 0.35 * k); }
        else if (f.bolt) R.glow(f.x2, f.y2, 26, '#fff27a', 0.5 * k);
        else R.glow(f.x, f.y, f.r * 1.9, LIGHT_COL[f.style] || '#ffb347', 0.75 * k * k);
      }
      for (const u of units) if (u.alive && !u.hidden && u.shield > 0) { const S2 = spOf(u); R.glow(u.x, u.y - S2.hitY * u.scale, S2.hitR * u.scale * 2.4, '#8fe0ff', 0.18); }
      R.add(false);
    }
    glWater(true);
    for (const f of floaters) R.text(f.text, f.x, f.y - f.t * 0.5, { size: f.size || 15, fill: f.col, stroke: f.col === '#ffffff' || f.col === '#fff' ? '#000' : '#fff', sw: 0.8 }, clamp(1 - f.t / 60, 0, 1));
    // primeiro plano
    glLayer(1.3); glDrawSnap('fore');
    // clima e clarão (tela)
    R.setBase(1, 0, 0);
    if (scene === 'battle' && (weather || wxPrev)) { if (wxK >= 1) glWx(weather, 1); else { glWx(wxPrev, 1 - wxK); glWx(weather, wxK); } }
    if (flash.a > 0.01) R.rect(0, 0, 800, 500, flash.col, flash.a);
    glUi();
    R.end();
    R.pump(glLoading ? 40 : lite ? 3 : 5);      // na tela de preparo, envia bem mais imagens por quadro
  }

  // contador de quadros desenhados por segundo (⚙ Ajustes → Mostrar FPS)
  let fpsN = 0, fpsT0 = 0, fpsVal = 0;
  function fpsTick() {
    fpsN++;
    const now = Date.now();
    if (!fpsT0) fpsT0 = now;
    if (now - fpsT0 >= 1000) { fpsVal = Math.round(fpsN * 1000 / (now - fpsT0)); fpsN = 0; fpsT0 = now; }
    const t = settings.showFps ? `${fpsVal} FPS${glActive ? ' · WebGL' : ''}${lite ? ' · leve' : ''}` : '';
    const el = $('fpsT'); if (el && el.textContent !== t) el.textContent = t;
  }
  let hudKey = '', hudAt = -99, barAt = -99;
  let rTime = 0, rN = 0;
  function renderAll() {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    renderAllInner();
    if (t0) { rTime += performance.now() - t0; rN++; }
  }
  function renderAllInner() {
    fpsTick();
    // enquanto um golpe cava, o contorno do terreno é refeito no máximo a cada 4 quadros
    if (dirty && glShader()) { miniTerr = null; dirty = false; }      // terreno pela placa de vídeo: o SVG do chão não precisa ser refeito
    else if (dirty && (!terrDirty || state !== 'flying' || frameNo - terrAt > 3)) { renderTerrain(); dirty = false; terrAt = frameNo; }
    // água e nuvens se mexem devagar: atualizar a cada poucos quadros evita repintar faixas largas da tela
    const useGL = glUse();
    if (!useGL) {
      if (frameNo % (lite ? 8 : 4) === 0) renderWater();
      if (!lite && frameNo % 6 === 0) renderClouds();
      placeLayers();
    }

    const inBattle = scene === 'battle';
    const act = inBattle && state !== 'over' && teams[turnTeam] ? activeUnit() : null;

    if (useGL) {
      renderGL(act, inBattle);
      $('wx').innerHTML = '';
      setAttrOnce('flashR', 'opacity', '0');
    } else {
    if (scene === 'intro') renderIntro();
    else {
      $('intro').innerHTML = '';
      let aim = '';
      if (inBattle && act && (state === 'aim' || (state === 'ai' && ai && ['aim', 'wait', 'charge'].includes(ai.phase)))) {
        const a = angle * Math.PI / 180, m = mouthAt(act, act.face, ballMode || netMode);
        const rel = Math.round(elevOf(act));
        aim = aimSvg(m.x, m.y, a, rel);
      }
      $('aim').innerHTML = aim;
    }

    renderKeyed('pickups', scene === 'battle' ? pickupItems() : []);

    renderKeyed('worms', scene === 'intro' ? [] : inBattle ? renderBattleUnits(act) : units.map(u => { const p = unitParts(u, { color: '#fff', noBar: true }); return { k: u.uid, t: p.t, h: p.h }; }));

    $('proj').innerHTML = projs.map(projSvg).join('') + captureSvg() + (ORIG ? netsSvg() : '');

    $('pshadow').innerHTML = lite ? '' : projs.map(p => {
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

    $('fx').innerHTML = bolts.map(b => {                     // aviso piscando onde o raio vai cair
      if (b.t >= 0 || (frameNo >> 3) % 2) return '';
      const sy = Math.min(surf(b.x, 0), WATER);
      return `<line x1="${f1(b.x)}" y1="${f1(sy - 220)}" x2="${f1(b.x)}" y2="${f1(sy)}" stroke="#fff27a" stroke-width="2" stroke-dasharray="6 6" opacity=".8"/>
        <circle cx="${f1(b.x)}" cy="${f1(sy)}" r="14" fill="none" stroke="#fff27a" stroke-width="2"/><text x="${f1(b.x)}" y="${f1(sy - 226)}" text-anchor="middle" font-size="16">⚡</text>`;
    }).join('') + fx.map(f => {
      const k = f.t / f.max;
      if (f.sky) {
        const d = f.pts.map((q, i) => (i ? 'L' : 'M') + f1(q[0]) + ',' + f1(q[1])).join(' ');
        return `<path d="${d}" fill="none" stroke="#ffd000" stroke-width="9" opacity="${(0.45 * (1 - k)).toFixed(2)}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fffbe0" stroke-width="3" opacity="${(1 - k).toFixed(2)}" stroke-linejoin="round"/>`;
      }
      if (f.beam) {
        const w = 16 * (1 - k * 0.7);
        return `<line x1="${f1(f.x)}" y1="${f1(f.y)}" x2="${f1(f.x2)}" y2="${f1(f.y2)}" stroke="#ffb43c" stroke-width="${f1(w + 10)}" stroke-linecap="round" opacity="${(0.35 * (1 - k)).toFixed(2)}"/>
          <line x1="${f1(f.x)}" y1="${f1(f.y)}" x2="${f1(f.x2)}" y2="${f1(f.y2)}" stroke="#fff3c0" stroke-width="${f1(w)}" stroke-linecap="round" opacity="${(0.9 * (1 - k)).toFixed(2)}"/>
          <line x1="${f1(f.x)}" y1="${f1(f.y)}" x2="${f1(f.x2)}" y2="${f1(f.y2)}" stroke="#ffffff" stroke-width="${f1(w * 0.35)}" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`;
      }
      if (f.bolt) {
        const n = 6; let d = `M${f1(f.x)},${f1(f.y)}`;
        for (let i = 1; i < n; i++) { const t = i / n; d += ` L${f1(f.x + (f.x2 - f.x) * t + ((i * 7 + f.t) % 5 - 2) * 3)},${f1(f.y + (f.y2 - f.y) * t + ((i * 5 + f.t) % 5 - 2) * 3)}`; }
        d += ` L${f1(f.x2)},${f1(f.y2)}`;
        return `<path d="${d}" fill="none" stroke="#ffd000" stroke-width="5" opacity="${(0.5 * (1 - k)).toFixed(2)}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fffbd0" stroke-width="2" opacity="${(1 - k).toFixed(2)}" stroke-linejoin="round"/>`;
      }
      return `<circle cx="${f1(f.x)}" cy="${f1(f.y)}" r="${f1(f.r * Math.min(1, k * 1.6))}" fill="${f.fill}" opacity="${(1 - k).toFixed(2)}"/>
              <circle cx="${f1(f.x)}" cy="${f1(f.y)}" r="${f1(f.r * k * 1.4)}" fill="none" stroke="#fff"
                      stroke-width="${f1(3 * (1 - k))}" opacity="${(0.8 * (1 - k)).toFixed(2)}"/>`;
    }).join('');

    $('floaters').innerHTML = floaters.map(f => `<text x="${f1(f.x)}" y="${f1(f.y - f.t * 0.5)}" text-anchor="middle"
        font-size="${f.size || 15}" font-weight="bold" fill="${f.col}" stroke="${f.col === '#ffffff' || f.col === '#fff' ? '#000' : '#fff'}" stroke-width=".8"
        opacity="${clamp(1 - f.t / 60, 0, 1).toFixed(2)}">${f.text}</text>`).join('');
    }

    if (useGL) $('powerbar').innerHTML = '';                     // no WebGL a barra é desenhada pela placa de vídeo
    else if (charging || keys.up || keys.down || keys.left || keys.right || frameNo - barAt >= 4 || scene !== 'battle') { barAt = frameNo;
    $('powerbar').innerHTML = scene === 'battle' ? bottomBarSvg() : charging
      ? `<rect x="10" y="54" width="208" height="14" rx="7" fill="#000" opacity=".45"/>
         <rect x="12" y="56" width="${f1(power * 2.04)}" height="10" rx="5" fill="url(#pow)"/>`
      : ''; }

    // chuva/neve e o clarão ficam em camadas próprias: o painel só é reescrito quando um texto dele muda
    if (!useGL) {
      $('wx').innerHTML = weatherSvg();
      if (scene === 'battle') { animWx(weather, 'n'); if (wxK < 1) animWx(wxPrev, 'p'); }
      setAttrOnce('flashR', 'opacity', flash.a > 0.01 ? flash.a.toFixed(2) : '0');
      if (flash.a > 0.01) setAttrOnce('flashR', 'fill', flash.col);
    }
    // painel: refeito a cada poucos quadros (ou na hora, quando muda o estado/turno) — nada nele precisa de 60 por segundo
    const hk = scene + state + turnTeam + (teams[turnTeam] ? teams[turnTeam].cur : '') + ballMode + !!panel + (guest ? guest.uid : '');
    if (hk !== hudKey || frameNo - hudAt >= (lite ? 6 : 3)) {
      hudKey = hk; hudAt = frameNo; mmShown = false;
      const h = hudSvg();
      if (useGL) { glHudWant = h; $('hud').innerHTML = ''; } else $('hud').innerHTML = h;
    }
    if (useGL) { $('mmview').innerHTML = ''; $('msgbox').innerHTML = ''; }
    else { $('mmview').innerHTML = mmViewSvg(); $('msgbox').innerHTML = msgSvg(); }
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
    if (menuPage === 'stages') return stagesSvg();
    if (menuPage === 'starter') return starterSvg();
    const save = loadSave();
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".38"/>
      <g transform="translate(400 112)" text-anchor="middle">
        <text y="0" font-size="52" font-weight="900" fill="#fff" stroke="#173a78" stroke-width="7" paint-order="stroke" letter-spacing="1">Monstrinhos</text>
        <text y="38" font-size="30" font-weight="800" fill="#ffd34d" stroke="#6a3a00" stroke-width="5" paint-order="stroke" letter-spacing="4">DE ARTILHARIA</text>
      </g>
      ${ORIG ? `<g transform="translate(130 128) scale(4) rotate(-12)">${eggSvg('#e0583a')}</g><g transform="translate(670 128) scale(4) rotate(12)">${eggSvg('#4aa8e8')}</g>`
             : `<g transform="translate(130 100)">${Art.ball(30, -12)}</g><g transform="translate(670 100)">${Art.ball(30, 12)}</g>`}`;
    let y = 196;
    if (save) {
      s += uiBtn(250, y, 300, 50, save.done ? 'Continuar — Campeão ★' : `Continuar — Fase ${save.stage + 1}`, continueCampaign); y += 62;
      s += uiBtn(250, y, 300, 50, 'Escolher fase', openStages); y += 62;
    }
    s += uiBtn(250, y, 300, 50, save ? 'Novo jogo (apaga o progresso)' : 'Novo jogo', startNewGame, { fs: save ? 18 : 20 });
    s += ORIG ? `<text x="400" y="472" text-anchor="middle" font-size="10" fill="#fff" opacity=".8">Versão com monstrinhos originais.</text>` : `<text x="400" y="472" text-anchor="middle" font-size="10" fill="#fff" opacity=".8">Projeto de fã, sem fins lucrativos. Pokémon e seus nomes pertencem a Nintendo / Game Freak / Creatures.</text>`;
    s += `
      <text x="400" y="488" text-anchor="middle" font-size="10" fill="#fff" opacity=".6">Todas as artes são desenhos próprios em SVG.</text>`;
    return s;
  }

  // seleção de fase: só as já liberadas; dá para voltar e rejogar para capturar o que ficou para trás
  function openStages() {
    const sv = loadSave(); if (!sv) return;
    menuPage = 'stages'; uiSel = Math.min(sv.stage, STAGES.length - 1); Sfx.select();
  }

  function stagesSvg() {
    const sv = loadSave() || { stage: 0, done: false };
    const cols = 4, cw = 168, ch = 68, gx = 12, gy_ = 10, x0 = Math.round((VW - (cols * cw + (cols - 1) * gx)) / 2), y0 = 84;
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".62"/>
      <text x="400" y="40" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">Escolher fase</text>
      <text x="400" y="62" text-anchor="middle" font-size="12" fill="#cfe">Toque numa fase para ver o que dá para capturar, e em Jogar para entrar. O mapa muda a cada partida. ✨ Shiny: 1 em 1000.</text>`;
    STAGES.forEach((st, i) => {
      const col = i % cols, row = Math.floor(i / cols), x = x0 + col * (cw + gx), y = y0 + row * (ch + gy_);
      const locked = i > sv.stage, cleared = sv.done || i < sv.stage, cur = i === sv.stage && !sv.done;
      const sel = i === uiSel;
      uiList.push({ x, y, w: cw, h: ch, fn: () => { if (kbd && !locked) playStage(i); }, disabled: false });
      s += `<g opacity="${locked ? 0.42 : 1}"><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="12" fill="${sel && !locked ? '#ffb347' : '#1b2a44'}" fill-opacity="${sel && !locked ? 0.96 : 0.92}"
          stroke="${sel ? '#ffb347' : cur ? '#8fe070' : '#fff'}" stroke-opacity="${sel || cur ? 1 : 0.55}" stroke-width="${sel || cur ? 3 : 1.6}"/>
        <text x="${x + 16}" y="${y + 40}" font-size="30" font-weight="900" fill="${sel && !locked ? '#241400' : '#ffd34d'}">${i + 1}</text>
        <text x="${x + 44}" y="${y + 29}" font-size="12.5" font-weight="bold" fill="${sel && !locked ? '#241400' : '#fff'}">${st.name}</text>
        <text x="${x + 44}" y="${y + 47}" font-size="10" fill="${sel && !locked ? '#3a2400' : '#bfe3ff'}">${locked ? 'bloqueada' : cleared ? '✔ concluída' : 'fase atual'}${st.boss ? ' · CHEFE' : ''}</text>
        ${locked ? `<text x="${x + cw - 12}" y="${y + 24}" text-anchor="end" font-size="15">🔒</text>` : ''}</g>`;
    });
    // detalhes da fase em foco
    const fi = Math.min(Math.max(uiSel, 0), STAGES.length - 1), F = STAGES[fi], fl = fi > sv.stage;
    const names = a => Array.from(new Set(a)).map(e => SPECIES[e].name).join(', ');
    const wx = (F.weather || []).map(w => WEATHER[w.type].name).join(' / ') || 'sem clima (ambiente fechado)';
    const iy = y0 + Math.ceil(STAGES.length / cols) * (ch + gy_) + 4;
    s += `<rect x="${x0}" y="${iy}" width="${cols * cw + (cols - 1) * gx}" height="92" rx="12" fill="#0d1b2a" fill-opacity=".85" stroke="#fff" stroke-opacity=".35"/>`;
    if (fl) s += `<text x="400" y="${iy + 52}" text-anchor="middle" font-size="14" fill="#fff" opacity=".85">🔒 Vença a fase ${fi} para liberar.</text>`;
    else s += `<text x="${x0 + 16}" y="${iy + 22}" font-size="14" font-weight="bold" fill="#ffd34d">${fi + 1}. ${F.name}</text>
      <text x="${x0 + 16}" y="${iy + 42}" font-size="11.5" fill="#fff">Selvagens: <tspan fill="#ffb3a8">${names(F.enemies)}</tspan>${(F.pool || []).filter(e => !F.enemies.includes(e)).length ? `<tspan fill="#ffd0c8" font-size="10"> · às vezes: ${names((F.pool || []).filter(e => !F.enemies.includes(e)))}</tspan>` : ''}</text>
      <text x="${x0 + 16}" y="${iy + 60}" font-size="11.5" fill="#fff">Visitantes: <tspan fill="#ffe27a">${names((F.guests || []).map(g => g.sp)) || '—'}</tspan></text>
      <text x="${x0 + 16}" y="${iy + 78}" font-size="11.5" fill="#fff">Clima: <tspan fill="#9fe0ff">${wx}</tspan></text>`;
    s += uiBtn(170, 436, 210, 42, '◀ Voltar', () => { menuPage = 'main'; uiSel = 1; }, { fs: 17 });
    s += uiBtn(420, 436, 210, 42, 'Jogar ▶', () => { if (fi <= sv.stage) playStage(fi); }, { fs: 17, disabled: fl });
    return s;
  }

  function startNewGame() { clearSave(); if (ORIG) { menuPage = 'starter'; uiSel = 0; Sfx.select(); } else initIntro(); }
  // versão original: em vez da cidade das Pokébolas, escolhe o parceiro inicial
  function starterSvg() {
    const list = MS.ORIG_STARTERS;
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".55"/>
      <text x="400" y="78" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" stroke="#173a78" stroke-width="6" paint-order="stroke">Escolha seu parceiro</text>
      <text x="400" y="108" text-anchor="middle" font-size="14" fill="#bfe3ff">Os outros você ganha nas fases: derrote com um golpe fraco e pegue o ovo!</text>`;
    const NOTE = { abelha: 'Rainha da colmeia. Manda as abelhinhas atacarem.', galinha: 'Nervosa. Cacareja e bica sem parar.', barata: 'Sobrevive a tudo. Uma vez por fase.', baiacu: 'Infla quando apanha. Aí leva metade.', camaleao: 'Muda de cor. Some depois de atacar.', pombo: 'Rei da praça. Ataca lá do alto.', brasito: 'Esquentadinho. Assopra o próprio topete.', gotalho: 'Calmo e cuidadoso. Rega toda plantinha que vê.', musguinho: 'Tímido. O chapéu sempre cai nos olhos.',
      caramelo: 'A alegria em pessoa. Nunca para de abanar o rabo.', pinscher: 'Pequeno e brabo. Com pouca vida, entra em fúria.', tatubola: 'Medroso e cascudo. Vira bola quando se assusta.' };
    list.forEach((sp, i) => {
      const x = 130 + i * 190, S = SPECIES[sp], sel = uiSel === i;
      const u = { uid: i + 1, sp, moving: false, breath: 0, hurt: 0, capScale: 1 };
      const mania = ((frameNo + i * 200) % 300) < 90 ? ((frameNo + i * 200) % 300) / 90 : null;
      s += uiBtn(x, 140, 160, 250, '', () => newCampaign(sp), { fs: 1 });
      s += `<g transform="translate(${x + 80} 290) scale(2.6)" style="pointer-events:none">${Art.draw(sp, { f: frameNo, blink: ((frameNo + i * 50) % 200) < 7, breath: 0, bob: Math.sin(frameNo * 0.08 + i) * 0.7, step: 0, x: i, charge: false, flap: false, mania, hurt: false })}</g>
        <text x="${x + 80}" y="320" text-anchor="middle" font-size="20" font-weight="800" fill="${sel ? '#3a2400' : '#fff'}" style="pointer-events:none">${S.name}</text>
        <g transform="translate(${x + 80} 336)">${Art.typeDots(S.types, 0, 0, TYPE_COLOR)}</g>
        <text x="${x + 80}" y="358" text-anchor="middle" font-size="10.5" fill="${sel ? '#3a2400' : '#bfe3ff'}" style="pointer-events:none">${NOTE[sp].split('. ')[0]}.</text>
        <text x="${x + 80}" y="372" text-anchor="middle" font-size="10.5" fill="${sel ? '#3a2400' : '#bfe3ff'}" style="pointer-events:none">${NOTE[sp].split('. ')[1] || ''}</text>`;
      void u;
    });
    s += uiBtn(300, 420, 200, 42, '◀ Voltar', () => { menuPage = 'main'; uiSel = 0; }, { fs: 17 });
    return s;
  }

  function typeChips(types, cx, y) { return Art.typeDots(types, cx, y, TYPE_COLOR); }

  const PER_PAGE = 14;

  function teamSvg() {
    const R = campaign.roster, st = STAGES[stageIdx], n = R.length;
    const cols = 7, cw = 100, gap = 8, x0 = Math.round((VW - (cols * cw + (cols - 1) * gap)) / 2), y0 = 108, ch = 142;
    const pages = Math.max(1, Math.ceil(n / PER_PAGE));
    pageNo = clamp(pageNo, 0, pages - 1);
    const foes = st.enemies.map(e => SPECIES[e]);
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".55"/>
      <text x="400" y="38" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">Escolha até 3 ${ORIG ? 'monstrinhos' : 'Pokémon'}</text>
      <text x="400" y="60" text-anchor="middle" font-size="13" fill="#ffd34d">Fase ${stageIdx + 1}: ${st.name}</text>
      <text x="400" y="80" text-anchor="middle" font-size="12" fill="#cfe">Inimigos: ${Array.from(new Set(foes.map(f => f.name))).join(', ')}</text>
      <text x="400" y="97" text-anchor="middle" font-size="10.5" fill="#fff" opacity=".8">▲ = algum golpe seu é super efetivo contra um inimigo &nbsp;·&nbsp; ★ = golpe variante</text>`;
    const first = pageNo * PER_PAGE;
    for (let k = 0; k < PER_PAGE && first + k < n; k++) {
      const i = first + k, sp = R[i], S = SPECIES[sp], col = k % cols, row = Math.floor(k / cols);
      const x = x0 + col * (cw + gap), y = y0 + row * (ch + 6), picked = campaign.sel.includes(i);
      const idx = uiList.length;
      uiList.push({ x, y, w: cw, h: ch, fn: () => {
        const kk = campaign.sel.indexOf(i);
        if (kk >= 0) { if (campaign.sel.length > 1) campaign.sel.splice(kk, 1); }
        else if (campaign.sel.length < 3) campaign.sel.push(i);
        else { showMsg(ORIG ? 'Máximo de 3 monstrinhos!' : 'Máximo de 3 Pokémon!', 60); return; }
        Sfx.click();
      } });
      const mvs = campaign.mv[i], mk = MS.movesOf(sp, mvs), wps = mk.map(k2 => WEAPONS[k2]);
      const adv = wps.some(wp => !wp.none && foes.some(f => typeMult(wp.type, f.types) > 1));
      const selCur = idx === uiSel, sc = Math.min(1.3, 50 / (S.h * (S.scale || 1)));
      const lines = wps.map((wp, li) => `<text x="${x + cw / 2}" y="${y + (wps.length > 1 ? 122 + li * 10 : 127)}" text-anchor="middle" font-size="9" fill="${mvs !== 'b' ? '#ffe27a' : '#cde'}">${mvs !== 'b' ? '★ ' : ''}${wp.label}</text>`).join('');
      s += `<g><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="12" fill="${picked ? '#2b4a2a' : '#1b2a44'}" fill-opacity=".92"
          stroke="${picked ? '#8fe070' : '#fff'}" stroke-opacity="${picked ? 1 : 0.45}" stroke-width="${picked ? 3 : 1.5}"/>
        ${selCur ? `<rect x="${x - 3}" y="${y - 3}" width="${cw + 6}" height="${ch + 6}" rx="14" fill="none" stroke="#ffb347" stroke-width="3"/>` : ''}
        <g transform="translate(${x + cw / 2} ${y + 80}) scale(${f1(sc)})"><g${shF(sp, campaign.sh[i])}>${Art.draw(sp, { f: frameNo, blink: false, breath: 0, bob: Math.sin(frameNo * 0.08 + i) * 0.7, step: 0, x: i })}</g></g>
        <text x="${x + cw / 2}" y="${y + 96}" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">${campaign.sh[i] ? '✨' : ''}${S.name}</text>
        ${typeChips(S.types, x + cw / 2, y + 107)}
        ${lines}
        ${adv ? `<text x="${x + cw - 10}" y="${y + 20}" text-anchor="end" font-size="14" font-weight="bold" fill="#8fe070">▲</text>` : ''}
        ${S.evo ? `<rect x="${x + 14}" y="${y + 136}" width="${cw - 28}" height="3.4" rx="1.7" fill="#000" opacity=".55"/><rect x="${x + 14}" y="${y + 136}" width="${f1((cw - 28) * clamp(campaign.xp[i] / S.evoXp, 0, 1))}" height="3.4" rx="1.7" fill="#6ad0ff"/>` : ''}
        ${picked ? `<text x="${x + 10}" y="${y + 20}" font-size="14" font-weight="bold" fill="#8fe070">✔</text>` : ''}</g>`;
    }
    const by = y0 + 2 * (ch + 6) + 4;
    if (pages > 1) {
      s += uiBtn(300, by, 44, 26, '◀', () => { pageNo = (pageNo + pages - 1) % pages; uiSel = 0; }, { fs: 14 });
      s += `<text x="400" y="${by + 18}" text-anchor="middle" font-size="12" fill="#fff">Página ${pageNo + 1}/${pages}</text>`;
      s += uiBtn(456, by, 44, 26, '▶', () => { pageNo = (pageNo + 1) % pages; uiSel = 0; }, { fs: 14 });
    }
    s += `<text x="400" y="${by + 48}" text-anchor="middle" font-size="13" fill="#fff">Escolhidos: ${campaign.sel.length}/3${ORIG ? '' : ` &nbsp;·&nbsp; Pokébolas: ${campaign.balls}`}</text>`;
    s += uiBtn(280, by + 56, 240, 38, 'Começar ▶', () => {
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
      s += `<text x="400" y="${y + 18}" text-anchor="middle" font-size="13" fill="#8fe070" font-weight="bold">${ORIG ? '🥚 Ovos chocados nesta fase' : 'Capturados nesta fase'}</text>`;
      const n = P.caught.length, step = 90, sx = 400 - (n - 1) * step / 2;
      P.caught.forEach((c, i) => {
        const sp = c.sp;
        s += `<g transform="translate(${f1(sx + i * step)} ${y + 88})"><g${shF(sp, c.sh)}>${Art.draw(sp, { f: frameNo, blink: false, breath: 0, bob: Math.sin(frameNo * 0.08 + i) * 0.7, step: 0, x: i })}</g>
          <text y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">${c.sh ? '✨ ' : ''}${SPECIES[sp].name}${c.mvs !== 'b' ? `<tspan fill="#ffd34d"> ${stars(c.mvs)}</tspan>` : ''}</text>
          ${c.mvs !== 'b' ? `<text y="26" text-anchor="middle" font-size="9.5" fill="#ffe27a">${MS.movesOf(sp, c.mvs).map(k => WEAPONS[k].label).join(' + ')}</text>` : ''}</g>`;
      });
      y += 130;
    } else y += 20;
    const bn = P.buttons.length, bwid = 200, g = 20, total = bn * bwid + (bn - 1) * g;
    P.buttons.forEach((b, i) => { s += uiBtn(400 - total / 2 + i * (bwid + g), by + bh - 64, bwid, 44, b.label, b.fn, { fs: 17 }); });
    return s;
  }

  // botões do ⚙ (também navegáveis pelas setas do controle: linhas 2 em diante)
  // instalar o jogo (ícone na tela inicial, abre sem internet) quando o navegador oferece
  let installEvt = null;
  if (typeof addEventListener === 'function') addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  function installApp() {
    if (!installEvt) return;
    try { installEvt.prompt(); installEvt.userChoice && installEvt.userChoice.then(() => { installEvt = null; }); } catch (_) { installEvt = null; }
    Sfx.click();
  }
  function drawerBtns() {
    const qn = 'Qualidade: ' + (settings.quality === 'auto' ? (lite ? 'Auto (leve)' : 'Auto (alta)') : QUALITY_NAME[settings.quality]);
    return [
      [qn, d => cycleQuality(d === -1 ? -1 : 1)],
      ['Desenho: ' + (glCan() ? 'WebGL' : glFailed && settings.render !== 'svg' ? 'SVG (sem WebGL)' : 'SVG'), () => toggleRender()],
      [document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia', () => toggleFullscreen()],
      ['Teste do controle', () => { location.href = 'controle.html'; }],
      [Sfx.isOn() ? 'Som: ligado' : 'Som: desligado', () => toggleSound()],
      [settings.showFps ? 'Mostrar FPS: sim' : 'Mostrar FPS: não', () => { settings.showFps = !settings.showFps; applySettings(); Sfx.click(); }],
      installEvt ? ['Instalar o jogo', () => installApp()] : null,
      ['Fechar', () => toggleSettings(false)]
    ].filter(Boolean);
  }
  function drawerSvg() {
    const e = 1 - Math.pow(1 - drawerT, 3), X = 800 - 250 * e;
    sliderRects = [];
    let s = `<rect width="800" height="500" fill="#000" opacity="${(0.35 * e).toFixed(2)}"/>
      <rect x="${f1(X)}" y="0" width="260" height="500" fill="#101b33" fill-opacity=".97"/>
      <rect x="${f1(X)}" y="0" width="3" height="500" fill="#ffd34d" opacity=".8"/>
      <text x="${f1(X + 24)}" y="38" font-size="20" font-weight="800" fill="#fff">⚙ Ajustes</text>`;
    SLIDERS.forEach((S, i) => {
      const y = 96 + i * 76, tx = X + 24, tw = 202, v = settings[S.key], k = (v - S.min) / (S.max - S.min), foc = settingsRow === i;
      sliderRects.push({ x: tx, y: y - 14, w: tw, h: 36 });
      const def = (S.def - S.min) / (S.max - S.min);
      s += `<g>${foc ? `<rect x="${f1(X + 12)}" y="${y - 34}" width="226" height="72" rx="12" fill="none" stroke="#ffb347" stroke-width="2" opacity=".9"/>` : ''}
        <text x="${f1(tx)}" y="${y - 12}" font-size="14" font-weight="bold" fill="#fff">${S.label}</text>
        <text x="${f1(tx + tw)}" y="${y - 12}" text-anchor="end" font-size="14" font-weight="bold" fill="#ffd34d">${S.fmt(v)}</text>
        <rect x="${f1(tx)}" y="${y + 2}" width="${tw}" height="8" rx="4" fill="#000" opacity=".55"/>
        <rect x="${f1(tx)}" y="${y + 2}" width="${f1(tw * k)}" height="8" rx="4" fill="${S.key === 'bright' ? '#ffd34d' : '#6ad0ff'}"/>
        <line x1="${f1(tx + tw * def)}" y1="${y - 1}" x2="${f1(tx + tw * def)}" y2="${y + 13}" stroke="#fff" stroke-width="1.5" opacity=".6"/>
        <circle cx="${f1(tx + tw * k)}" cy="${y + 6}" r="${dragSlider === i ? 11 : 9}" fill="#fff" stroke="#173a78" stroke-width="2.5"/></g>`;
    });
    // botões (sem animação de posição para o toque funcionar): ficam dentro do painel
    const bx = Math.round(X + 24);
    // qualidade: Automática (liga o modo leve se o aparelho for lento) / Alta / Leve
    if (settingsOpen) uiSel = settingsRow >= SLIDERS.length ? uiList.length + settingsRow - SLIDERS.length : -1;   // destaque segue a linha escolhida
    { const bl = drawerBtns(), st = bl.length > 7 ? 34 : 38; bl.forEach((b, i) => { s += uiBtn(bx, 210 + i * st, 202, st - 6, b[0], b[1], { fs: 14 }); }); }
    s += `<text x="${f1(X + 125)}" y="494" text-anchor="middle" font-size="9.5" fill="#fff" opacity=".55">O abre e fecha · jogo em pausa</text>
          <text x="${f1(X + 236)}" y="38" text-anchor="end" font-size="9" fill="#fff" opacity=".5">versão ${GAME_VERSION}</text>`;
    return s;
  }

  function renderOverlay() {
    uiList = [];
    let s = '';
    if (scene === 'menu') s = menuSvg();
    else if (scene === 'team') s = teamSvg();
    if (glActive && (glLoading || glLoadFade > 0)) s += loadingSvg();
    if (evo) s = evolveSvg();
    if (panel) { uiList = []; s += panelSvg(); }
    if (drawerT > 0.01 || settingsOpen) { uiList = []; s += drawerSvg(); }
    if (uiSel >= uiList.length) uiSel = Math.max(0, uiList.length - 1);
    $('overlay').innerHTML = s;
  }

  // ---------- Botões de toque ----------
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  else for (const id of ['soundBtn', 'menuBtn', 'settingsBtn']) $(id).setAttribute('transform', 'translate(62 0)');
  // no celular o canto superior direito já é todo ocupado (☰ 🔊 PASSAR ↻) e a base tem a barra de mira: o ⚙ vai para a esquerda
  if (isTouch) $('settingsBtn').setAttribute('transform', 'translate(-664 352)');

  function syncButtons() {
    if (ORIG) { const t = document.querySelector && document.querySelector('#ballBtn text'); if (t && t.textContent !== 'REDE') t.textContent = 'REDE'; }
    const b = scene === 'battle' && !panel && state !== 'evolve' && !settingsOpen, i = scene === 'intro' && !settingsOpen;
    const camp = b && kind === 'campaign';
    const au = b && teams[turnTeam] && !teams[turnTeam].ai ? activeUnit() : null;
    const show = { left: b, right: b, up: b || i, down: b || i, fire: b || i, pass: !!au, restart: b || i,
                   ball: camp && (!ORIG || (eggs.length > 0 && !!au && state === 'aim')), move: !!(au && au.moves.length > 1), menu: b || i, sound: !settingsOpen, settings: true };
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

  // reiniciar pede confirmação (o ↻ fica perto do PASSAR e um toque errado perderia a batalha)
  function restart() {
    Sfx.click();
    if (panel || (scene !== 'intro' && !(scene === 'battle' && kind === 'campaign'))) return;
    keys = {}; if (charging) { charging = false; power = 0; Sfx.chargeStop(); }
    const close = () => { panel = null; uiSel = 0; syncButtons(); };
    panel = { pause: true, title: 'Reiniciar?', sub: scene === 'intro' ? 'As Pokébolas voltam e a cidade recomeça.' : 'A batalha desta fase recomeça do zero.',
              lines: [], caught: [],
              buttons: [{ label: 'Continuar jogando', fn: close }, { label: 'Reiniciar', fn: () => { panel = null; if (scene === 'intro') initIntro(); else restartStage(); } }] };
    uiSel = 0; syncButtons();
  }

  let fireLatch = false, fireDownAt = 0;
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
      else if (act === 'fire') {
        // TIRO: segurar e soltar, ou tocar uma vez para começar a carregar e outra para soltar (bom para ponteiro de TV)
        if (charging && fireLatch) { fireLatch = false; releaseFire(); }
        else { pressFire(); fireDownAt = Date.now(); fireLatch = false; }
      }
      else if (act === 'pass') passTurn();
      else if (act === 'restart') restart();
      else if (act === 'ball') toggleBall();
      else if (act === 'move') cycleMove();
      else if (act === 'menu') { Sfx.click(); initMenu(); }
      else if (act === 'sound') toggleSound();
      else if (act === 'settings') toggleSettings();
    };
    const release = e => {
      e.preventDefault();
      btn.classList.remove('on');
      if (holdKey) keys[holdKey] = false;
      else if (act === 'fire') {
        if (charging && !fireLatch && Date.now() - fireDownAt < 260) { fireLatch = true; showMsg('Carregando... toque TIRO de novo para soltar', 90); }
        else if (!fireLatch) releaseFire();
      }
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  });

  // clique/toque nos menus: testa as áreas desenhadas no overlay
  function svgPoint(e) {
    const r = $('game').getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * H };
  }
  function uiHit(p) { return uiList.findIndex(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h); }
  $('game').addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('.btn')) return;
    if (settingsOpen) {
      Sfx.unlock();
      const p = svgPoint(e), X = 800 - 250;
      const si = sliderRects.findIndex(r => p.x >= r.x - 10 && p.x <= r.x + r.w + 10 && p.y >= r.y && p.y <= r.y + r.h);
      if (si >= 0) {
        settingsRow = si; dragSlider = si;
        try { $('game').setPointerCapture(e.pointerId); } catch (_) {}
        const r = sliderRects[si], S = SLIDERS[si];
        setSlider(si, S.min + (S.max - S.min) * Math.min(1, Math.max(0, (p.x - r.x) / r.w)));
        return;
      }
      const i = uiHit(p);
      if (i >= 0) { uiSel = i; settingsRow = SLIDERS.length + i; activate(i); } else if (p.x < X) toggleSettings(false);
      return;
    }
    if (evo) { Sfx.unlock(); skipEvolve(); return; }
    if (scene === 'battle' && (W > VW || glActive) && !panel && state !== 'over' && !uiList.length) {
      const p = svgPoint(e);
      if (inMini(p)) { miniDrag = true; if (state === 'aim') miniPan(p); try { $('game').setPointerCapture(e.pointerId); } catch (_) {} return; }
      if (state === 'aim' && !charging) { if (panX === null) panX = clamp(cam.x, VW / 2, W - VW / 2); panDrag = { x0: p.x, pan0: panX }; try { $('game').setPointerCapture(e.pointerId); } catch (_) {} }
      return;
    }
    if (!uiList.length) return;
    const i = uiHit(svgPoint(e));
    if (i >= 0 && !uiList[i].disabled) { uiSel = i; Sfx.unlock(); activate(i); }
  });
  $('game').addEventListener('pointermove', e => {
    if (miniDrag) { if (state === 'aim') miniPan(svgPoint(e)); return; }
    if (panDrag) { const p = svgPoint(e); panX = clamp(panDrag.pan0 - (p.x - panDrag.x0) / cam.z, VW / 2, W - VW / 2); return; }
    if (dragSlider >= 0) {
      const p = svgPoint(e), r = sliderRects[dragSlider], S = SLIDERS[dragSlider];
      if (r) setSlider(dragSlider, S.min + (S.max - S.min) * Math.min(1, Math.max(0, (p.x - r.x) / r.w)));
      return;
    }
    if (e.pointerType !== 'mouse' || !uiList.length) return;
    const i = uiHit(svgPoint(e));
    if (i >= 0 && i !== uiSel) { uiSel = i; if (settingsOpen) settingsRow = SLIDERS.length + i; }
  });
  $('game').addEventListener('contextmenu', e => e.preventDefault());
  ['pointerup', 'pointercancel'].forEach(ev => $('game').addEventListener(ev, () => { dragSlider = -1; panDrag = null; miniDrag = false; }));

  function activate(i) {
    const b = uiList[i];
    if (!b || b.disabled) return;
    if (!(scene === 'team' && !panel)) Sfx.select();
    b.fn();
  }

  // ---------- Teclado ----------
  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

  addEventListener('keydown', e => {
    if (e.key === 'o' || e.key === 'O') { e.preventDefault(); toggleSettings(); return; }
    if (settingsOpen) {
      if (e.key === 'Escape') toggleSettings(false);
      else if (e.key === 'ArrowUp') { settingsRow = Math.max(0, settingsRow - 1); Sfx.click(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { settingsRow = Math.min(SLIDERS.length + drawerBtns().length - 1, settingsRow + 1); Sfx.click(); e.preventDefault(); }
      else if (settingsRow >= SLIDERS.length && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter' || e.code === 'Space')) {
        const b = drawerBtns()[settingsRow - SLIDERS.length];
        if (b && !e.repeat) b[1](e.key === 'ArrowLeft' ? -1 : 1);
        e.preventDefault();
      }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const S = SLIDERS[settingsRow], d = (e.key === 'ArrowRight' ? 1 : -1) * (S.max - S.min) * 0.05;
        setSlider(settingsRow, settings[S.key] + d); e.preventDefault();
      } else if (e.key === 'm' || e.key === 'M') toggleSound();
      return;
    }
    if (e.key === 'm' || e.key === 'M') { toggleSound(); return; }
    if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
    if (evo) {
      if (e.key === 'Escape') initMenu();
      else if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) skipEvolve(); }
      return;
    }
    // menus, seleção de time e painéis
    if (scene === 'menu' || scene === 'team' || panel) {
      const n = uiList.length; if (!n) return;
      const gridN = panel ? 0 : scene === 'team' ? 7 : (scene === 'menu' && menuPage === 'stages') ? 4 : 0;
      const nGrid = scene === 'team' ? Math.min(PER_PAGE, campaign.roster.length - pageNo * PER_PAGE) : STAGES.length;
      if (e.key === 'ArrowRight' || (!gridN && e.key === 'ArrowDown')) { uiSel = (uiSel + 1) % n; Sfx.click(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || (!gridN && e.key === 'ArrowUp')) { uiSel = (uiSel + n - 1) % n; Sfx.click(); e.preventDefault(); }
      else if (gridN && e.key === 'ArrowDown') { uiSel = uiSel + gridN < nGrid ? uiSel + gridN : (uiSel < nGrid ? n - 1 : uiSel); Sfx.click(); e.preventDefault(); }
      else if (gridN && e.key === 'ArrowUp') { uiSel = uiSel >= nGrid ? nGrid - 1 : Math.max(0, uiSel - gridN); Sfx.click(); e.preventDefault(); }
      else if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) { kbd = true; activate(uiSel); kbd = false; } }
      else if (e.key === 'Escape') { if (panel && panel.pause) { panel = null; syncButtons(); } else if (scene === 'menu') { if (menuPage === 'stages') { menuPage = 'main'; uiSel = 1; } else if (menuPage === 'starter') { menuPage = 'main'; uiSel = 0; } } else initMenu(); }
      return;
    }
    if (e.key === 'Escape') { initMenu(); return; }
    if (e.key === 'r' || e.key === 'R') { restart(); return; }
    if (state === 'over') return;
    if (ARROWS[e.key]) { keys[ARROWS[e.key]] = true; e.preventDefault(); return; }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) pressFire(); return; }
    if (e.key === 'Tab') { e.preventDefault(); return; }
    if (e.key === 'p' || e.key === 'P') { passTurn(); return; }
    if (e.key === 'b' || e.key === 'B') toggleBall();
    else if (e.key === 'g' || e.key === 'G') cycleMove();
    else if (e.key === 'q' || e.key === 'Q') keys.panL = true;
    else if (e.key === 'e' || e.key === 'E') keys.panR = true;
    else if (e.key === 'c' || e.key === 'C') panX = null;
  });

  addEventListener('keyup', e => {
    if (ARROWS[e.key]) keys[ARROWS[e.key]] = false;
    else if (e.code === 'Space') releaseFire();
    else if (e.key === 'q' || e.key === 'Q') keys.panL = false;
    else if (e.key === 'e' || e.key === 'E') keys.panR = false;
  });
  addEventListener('blur', () => { keys = {}; charging = false; power = 0; Sfx.chargeStop(); });

  // ---------- Controle (DualSense/PS5, Xbox, genéricos): vira as mesmas teclas do teclado ----------
  // X segura e solta para atirar (e confirma nos menus) · direcional/analógico esquerdo anda e mira · ▢ Pokébola · △ troca de golpe
  // L1/R1 (ou analógico direito) olham o mapa · L2 recentraliza · R2 passa a vez · Create reinicia · Options ajustes · O volta
  const PAD_KEYS = { 0: { key: ' ', code: 'Space' }, 2: { key: 'b' }, 3: { key: 'g' }, 4: { key: 'q', hold: true }, 5: { key: 'e', hold: true },
                     6: { key: 'c' }, 7: { key: 'p' }, 8: { key: 'r' }, 9: { key: 'o' },
                     12: { key: 'ArrowUp', hold: true }, 13: { key: 'ArrowDown', hold: true }, 14: { key: 'ArrowLeft', hold: true }, 15: { key: 'ArrowRight', hold: true } };
  // Fire TV (navegador Silk): o X e os direcionais/analógicos ficam presos no ponteiro e os botões chegam com outra numeração
  // (O = 0, △ = 1, ▢ = 3, L1 = 4, R1 = 5, Create = 8, Options = 9). Então: O atira, L1/R1 andam, △/▢ miram, Create troca de golpe.
  const PAD_KEYS_TV = { 0: { key: ' ', code: 'Space' }, 1: { key: 'ArrowUp', hold: true }, 3: { key: 'ArrowDown', hold: true },
                        4: { key: 'ArrowLeft', hold: true }, 5: { key: 'ArrowRight', hold: true },
                        6: { key: 'b' }, 7: { key: 'p' }, 8: { key: 'g' }, 9: { key: 'o' },
                        12: { key: 'ArrowUp', hold: true }, 13: { key: 'ArrowDown', hold: true }, 14: { key: 'ArrowLeft', hold: true }, 15: { key: 'ArrowRight', hold: true } };
  const isFireTV = () => typeof navigator !== 'undefined' && /Silk|AFT[A-Z]|Fire ?TV/i.test(navigator.userAgent || '');
  let padPrev = {}, padName = '';
  const padKey = (type, k) => dispatchEvent(new KeyboardEvent(type, { key: k.key, code: k.code || '' }));
  function pollPad() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null; for (const g of list || []) if (g && g.connected) { gp = g; break; }
    if (!gp) { if (padName) { padName = ''; padPrev = {}; } return; }
    const tv = isFireTV(), MAP = tv ? PAD_KEYS_TV : PAD_KEYS;
    if (!padName) { padName = gp.id || 'controle'; showMsg(tv ? 'Controle: O atira · L1/R1 anda · △/▢ mira · Create troca golpe' : 'Controle conectado! X atira · ▢ bola · △ golpe', 220); kbd = true; }
    const now = {}, ax = gp.axes || [];
    (gp.buttons || []).forEach((b, i) => { now['b' + i] = !!(b && (b.pressed || b.value > 0.5)); });
    // analógico esquerdo = direcional; analógico direito = olhar o mapa
    if ((ax[0] || 0) < -0.5) now.b14 = true; if ((ax[0] || 0) > 0.5) now.b15 = true;
    if ((ax[1] || 0) < -0.5) now.b12 = true; if ((ax[1] || 0) > 0.5) now.b13 = true;
    if ((ax[2] || 0) < -0.5) now.b4 = true; if ((ax[2] || 0) > 0.5) now.b5 = true;
    for (const i in MAP) {
      const k = MAP[i], on = !!now['b' + i], was = !!padPrev['b' + i];
      if (on && !was) Sfx.unlock(), padKey('keydown', k);
      else if (!on && was && (k.hold || k.code)) padKey('keyup', k);
    }
    // O (círculo) = voltar: fecha ajustes/perguntas e volta nos menus, sem sair da batalha por engano
    if (!tv && now.b1 && !padPrev.b1 && (settingsOpen || (panel && panel.pause) || scene === 'menu')) padKey('keydown', { key: 'Escape' });
    padPrev = now;
  }
  addEventListener('gamepadconnected', () => { Sfx.unlock(); });

  // ---------- Loop ----------
  function stepBattle() {
    if (state === 'aim') {
      if ((W > VW || glActive) && (keys.panL || keys.panR)) panX = clamp((panX === null ? cam.x : panX) + (keys.panR ? 8 : 0) - (keys.panL ? 8 : 0), VW / 2, W - VW / 2);
      const au = activeUnit();
      if (au && (keys.up || keys.down)) angle = fromElev(au, elevOf(au) + (keys.up ? 1.2 : -1.2));
      if (!charging) {
        const dir = keys.left ? -1 : keys.right ? 1 : 0;
        if (dir) {
          panX = null;
          // virar para o outro lado espelha a mira (mesma elevação, como nos mobiles)
          const wu = activeUnit();
          if (wu && wu.face !== dir) { wu.face = dir; angle = 180 - angle; }
          walkUnit(wu, dir);
        }
      } else {
        power = Math.min(100, power + 0.9);
        Sfx.chargeSet(power);
      }
    }
    if (state === 'aim' && !teams[turnTeam].ai) clampAim(activeUnit());      // andar muda a inclinação e a faixa de mira
    if (state === 'aim' && !teams[turnTeam].ai && --turnT <= 0) { if (charging) fire(); else passTurn(); }
    if (state === 'ai') stepAI();
    if (state === 'skip' && splashU) splashU.hop++;
    if (state === 'skip' && --skipT <= 0) { if (splashU) { splashU.hop = 0; splashU = null; } state = 'settle'; }
    if (state === 'guest') stepGuest();
    if (state === 'evolve') stepEvolve();
    if (state === 'flying') stepProjs();
    if (state === 'capture' && cap) stepCapture();
    if (state === 'settle') settle();
    if (kind === 'campaign' && state !== 'over' && state !== 'evolve') stepPickups();
    if (pendingPanel && --pendingPanel.t <= 0) {
      const pp = pendingPanel; pendingPanel = null;
      if (pp.evos && pp.evos.length) startEvolutions(pp.evos, pp.panel);
      else { panel = pp.panel; uiSel = 0; syncButtons(); }
    }
  }

  // lógica do jogo: sempre em passos fixos de 1/60 s (iPhones ProMotion chamam o quadro a 120 Hz)
  function tick() {
    frameNo++;
    pollPad();
    drawerT = Math.max(0, Math.min(1, drawerT + (settingsOpen ? 0.09 : -0.09)));
    if (settingsOpen) { updateCamera(); return; }   // pausado
    if (glActive && glLoading && scene === 'battle') { updateCamera(); return; }   // preparando as imagens: a batalha espera
    for (const u of units) {
      if (u.breath > 0) u.breath--;
      if (u.hurt > 0) u.hurt--;
      if (scene !== 'intro') u.moving = false;
    }
    if (panel && panel.pause) { updateCamera(); return; }          // pergunta na tela: jogo parado
    if (scene === 'battle') { stepBattle(); stepWeather(); if (eggs.length || nets.length) stepEggs(); if (ORIG) stepGrow(); }
    else if (scene === 'intro') stepIntro();
    updateUnits();
    stepParts();
    stepClouds();
    flash.a *= 0.86;
    for (const f of fx) f.t++;
    fx = fx.filter(f => f.t < f.max);
    for (const f of floaters) f.t++;
    floaters = floaters.filter(f => f.t < 60);
    if (msgT > 0 && --msgT === 0) msg = '';
    updateCamera();
  }

  // há movimento rápido na tela? então desenha a 60 fps; parado (mirando, menus) desenha a 30 fps
  function busy() {
    if (settingsOpen) return drawerT > 0 && drawerT < 1;
    if (glLoading || glLoadFade > 0) return true;
    return projs.length > 0 || charging || !!cap || fx.length > 0 || floaters.length > 0 || flash.a > 0.02 || cam.shake > 0 ||
      !!(evo) || ['flying', 'capture', 'settle', 'guest', 'skip', 'evolve'].includes(state) || scene === 'intro' ||
      !!(keys.left || keys.right || keys.up || keys.down || keys.panL || keys.panR) || camMoving || !!panDrag || miniDrag;
  }

  const STEP = 1000 / 60;
  let lastTs = 0, acc = 0, renderPar = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (typeof document !== 'undefined' && document.hidden) { lastTs = 0; acc = 0; return; }   // aba escondida: não gasta nada
    let steps = 1;
    if (typeof ts === 'number') {
      if (!lastTs) lastTs = ts;
      acc += Math.min(100, ts - lastTs); lastTs = ts;
      steps = 0;
      while (acc >= STEP - 2 && steps < 3) { acc -= STEP; steps++; }
      if (acc < -STEP) acc = 0;
      if (acc > STEP * 3) acc = 0;
    }
    if (!steps) return;
    for (let i = 0; i < steps; i++) tick();
    const b = busy();
    if (b) perfSample(ts); else perfLast = 0;
    // modo leve: desenha no máximo a 30 quadros por segundo (a lógica continua a 60)
    if (lite ? (++renderPar & 1) : (steps > 1 || b || (++renderPar & 1))) renderAll();
  }

  // para testes automatizados
  MS.debug = {
    get lastBall() { return lastBall; },
    get: () => ({ scene, kind, state, stageIdx, units, teams, campaign, cap, intro, panel, angle, power, wind, ballMode, turnTeam, ai, guest, gCool, gMode, evo, projs }),
    get pickups() { return pickups; }, BALLS, get eggs() { return eggs; }, get nets() { return nets; }, toggleNet, get netMode() { return netMode; }, get stageEggs() { return stageEggs; }, get campaign() { return campaign; },
    setWeather: w => { weather = w; lightT = 5; $('sun').style.display = (w === 'rain' || w === 'storm') ? 'none' : ''; glSkyDirty = true; }, get weather() { return weather; },
    glInfo: () => ({ aiw: !!aiWorker, aiJobs: aiJobSeq, active: glActive, loading: glLoading, prog: glLoadProg, gen: GLR && GLR.gen, resK: glResK, P: glP, snaps: Object.fromEntries(Object.entries(glSnap).map(([k, v]) => [k, { ok: v.ok, vb: v.vb }])), terrOk: glTerrOk, busy: glTerrBusy, full: glFullT, box: glBox, stats: GLR && GLR.stats, lite, ms: rN ? +(rTime / rN).toFixed(2) : 0, resetMs: (rTime = 0, rN = 0) }),
    setRender: r => { if ((settings.render === 'svg') !== (r === 'svg')) toggleRender(); },
    setMap: o => { mapOverride = o; }, setShinyP: v => { shinyP = v; }, get W() { return W; }, get panX() { return panX; }, get mapArch() { return mapArch; }, get cam() { return cam; }, get heights() { return heights; }, shF, rollArch, layoutSpawns, applyStatus, applyDots,
    toggleSettings, settings, sync: () => syncButtons(), plan: u => { ai = { phase: 'plan', t: 0 }; planShot(u); },
    forceGuest: sp => { gCool = 0; STAGES[stageIdx].guests = [{ sp, rarity: 1 }]; },
    skipEvolve, stageClear,
    initMenu, initIntro, playStage, cycleMove, maybeChangeWeather, rollWeather, initStage, newCampaign, beginStage, fire, toggleBall, pickTarget,
    setZoom: z => { settings.zoom = z; },
    setQuality: q => { settings.quality = q; settings.autoLite = false; applySettings(); }, get lite() { return lite; }, pollPad,
    setAngle: a => { angle = a; const u = activeUnit(); if (u && scene === 'battle') u.face = Math.cos(a * Math.PI / 180) >= 0 ? 1 : -1; }, aimWindow: u => aimWindow(u || activeUnit()), setPower: p => { power = p; }, passTurn, turnOrder,
    get windY() { return windY; }, solid, surf, carve, terrainPath, get mask() { return mask; },
    // procura (ângulo, força) para acertar um alvo com a arma 'wk' a partir do personagem da vez
    findShot: (target, wk) => {
      const u = activeUnit(), wp = WEAPONS[wk], S = spOf(u);
      for (let ang = 10; ang <= 170; ang += 1) {
        const a = ang * Math.PI / 180, face = Math.cos(a) >= 0 ? 1 : -1;
        const { x: x0, y: y0 } = mouthAt(u, face, wk === 'ball');
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

  cacheHtml(['introBack', 'decor', 'intro', 'aim', 'proj', 'pshadow', 'parts', 'fx', 'floaters', 'powerbar', 'wx', 'hud', 'mmview', 'msgbox', 'overlay']);
  glInit();
  applySettings();
  fitWrap();
  initMenu();
  requestAnimationFrame(frame);
})();

