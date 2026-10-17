const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function boot() {
  let nextFrame, now = 1000;
  const elements = new Map(), listeners = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const handlers = new Map();
      elements.set(id, { id, style: {}, innerHTML: '', textContent: '', children: [], dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute(k, v) { this[k] = String(v); }, getAttribute(k) { return this[k]; },
        addEventListener(type, fn) { handlers.set(type, fn); },
        dispatch(type) { handlers.get(type)?.({ preventDefault() {}, pointerId: 1 }); },
        getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 500 }; }, querySelectorAll() { return []; } });
    }
    const el = elements.get(id);
    if (id === 'clouds' && !el.children.length) el.children = Array.from({ length: 5 }, (_, i) => element('cloud-' + i));
    return el;
  }
  const fire = element('test-fire'); fire.dataset.act = 'fire';
  const math = Object.create(Math); let seed = 7351;
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const ctx = { console, Math: math, Date: class extends Date { static now() { return now; } },
    window: {}, navigator: { maxTouchPoints: 0 },
    document: { hidden: false, getElementById: element, querySelectorAll: s => s === '.btn' ? [fire] : [], body: element('body') },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    matchMedia: () => ({ matches: false }), requestAnimationFrame: fn => { nextFrame = fn; }, setTimeout() {}, clearTimeout() {} };
  vm.createContext(ctx);
  for (const name of ['data.js', 'art.js', 'art2.js', 'animated-kanto.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', name), 'utf8'), ctx);
  const MS = ctx.window.MS;
  MS.Sfx = new Proxy({ isOn: () => false }, { get: (o, k) => o[k] || (() => {}) });
  let code = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
  // Inspection and lightweight render counting exist only in this VM, not in the shipped game.
  code = code.replace("  cacheHtml(['introBack'", `
    let testRenders = 0, testTicks = 0;
    const originalTick = tick; tick = function() { testTicks++; return originalTick(); };
    renderAll = function() { testRenders++; };
    MS.inputFrameTest = {
      loading(v) { glActive = v; glLoading = v; },
      state: () => ({ charging, power, projs: projs.length }),
      counts: () => ({ renders: testRenders, ticks: testTicks }),
      clearCounts() { testRenders = testTicks = 0; }
    };
    cacheHtml(['introBack'`);
  vm.runInContext(code, ctx);
  function key(type) { for (const fn of listeners.get(type) || []) fn({ key: ' ', code: 'Space', repeat: false, preventDefault() {} }); }
  return { MS, hook: MS.inputFrameTest, fire, key, ctx, frame: ts => nextFrame(ts), time: t => { now = t; } };
}

// A released command during preparation must never leave an invisible charge behind.
for (const input of ['keyboard', 'touch']) {
  const g = boot(); g.MS.debug.newCampaign('charmander'); g.hook.loading(true);
  if (input === 'keyboard') { g.key('keydown'); g.key('keyup'); }
  else { g.fire.dispatch('pointerdown'); g.time(1100); g.fire.dispatch('pointerup'); }
  assert.equal(g.hook.state().charging, false, input + ': loading cannot start a charge');
  g.hook.loading(false); for (let i = 0; i < 10; i++) g.frame();
  assert.equal(g.hook.state().power, 0, input + ': releasing during loading cannot charge after it finishes');
  assert.equal(g.hook.state().projs, 0);
}

// If preparation starts while a button is already held, releasing it cancels that charge.
for (const input of ['keyboard', 'touch']) {
  const g = boot(); g.MS.debug.newCampaign('charmander');
  if (input === 'keyboard') g.key('keydown'); else g.fire.dispatch('pointerdown');
  assert.equal(g.hook.state().charging, true);
  g.hook.loading(true);
  if (input === 'keyboard') g.key('keyup'); else { g.time(1100); g.fire.dispatch('pointerup'); }
  assert.equal(g.hook.state().charging, false, input + ': loading release cancels an existing charge');
}

// Both quick and held touches fire exactly once on release, with no latched charge.
for (const duration of [0, 50, 100, 250, 600]) {
  const g = boot(); g.MS.debug.newCampaign('charmander');
  g.fire.dispatch('pointerdown'); assert.equal(g.hook.state().charging, true);
  for (let i = 0; i < Math.floor(duration / (1000 / 60)); i++) g.frame();
  g.time(1000 + duration); g.fire.dispatch('pointerup');
  assert.equal(g.hook.state().charging, false, 'touch duration ' + duration);
  assert.equal(g.hook.state().projs, 1, 'exactly one shot on release');
}
{
  const g = boot(); g.MS.debug.newCampaign('charmander'); g.key('keydown');
  for (let i = 0; i < 20; i++) g.frame();
  assert(g.hook.state().power > 0); g.key('keyup');
  assert.equal(g.hook.state().charging, false); assert.equal(g.hook.state().projs, 1);
}
{
  const g = boot(); g.MS.debug.newCampaign('charmander'); g.fire.dispatch('pointerdown');
  for (let i = 0; i < 5; i++) g.frame();
  g.fire.dispatch('pointercancel');
  assert.equal(g.hook.state().charging, false); assert.equal(g.hook.state().power, 0);
  assert.equal(g.hook.state().projs, 0, 'cancelled touch must not shoot');
}

const measurements = [];
for (const quality of ['alta', 'leve']) for (const hz of [20, 25, 30, 60, 90, 120, 144]) {
  const g = boot(); g.MS.debug.setQuality(quality); g.MS.debug.initIntro();
  for (let i = 0; i <= hz; i++) g.frame(1000 + i * 1000 / hz);
  g.hook.clearCounts();
  for (let i = 1; i <= hz * 3; i++) g.frame(2000 + i * 1000 / hz);
  const { renders, ticks } = g.hook.counts(), expected = Math.min(hz, quality === 'leve' ? 30 : 60);
  assert(Math.abs(renders / 3 - expected) <= 1, `${quality} at ${hz} Hz: ${renders / 3} FPS, expected ${expected}`);
  assert(Math.abs(ticks / 3 - 60) <= 1, 'logic stays at 60 Hz');
  measurements.push({ quality, inputHz: hz, renderHz: renders / 3, logicHz: ticks / 3 });
}
{
  const g = boot(); g.MS.debug.setQuality('leve'); g.MS.debug.initIntro();
  for (let i = 0; i <= 60; i++) g.frame(1000 + i * 1000 / 60);
  g.hook.clearCounts();
  for (let i = 1; i <= 30; i++) g.frame(2000 + i * 1000 / 30);
  assert(g.hook.counts().renders >= 29, 'falling from 60 to 30 callbacks/s must keep drawing at 30 FPS');
  g.ctx.document.hidden = true; const before = g.hook.counts(); g.frame(900000);
  assert.deepEqual(g.hook.counts(), before, 'hidden tabs do not advance');
  g.ctx.document.hidden = false; g.frame(900017); g.frame(900034);
  assert(g.hook.counts().renders - before.renders <= 1, 'returning to the tab does not catch up missed renders');
}
console.log('OK: carregamento, soltar tiro, toques rápidos, manter pressionado e cancelamento, 20–144 Hz, mudança de frequência e aba oculta.');
console.log(JSON.stringify(measurements));
