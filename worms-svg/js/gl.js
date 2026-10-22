// Desenho em WebGL: o mundo inteiro vira lotes de imagens desenhados pela placa de vídeo.
// - texturas grandes (céu, fundos, terreno) vêm de "fotos" das camadas SVG do jogo;
// - desenhos pequenos (Pokémon, tiros, ícones) são convertidos de SVG para imagem uma vez e guardados num atlas;
// - círculos, linhas, retângulos e textos são desenhados com texturas prontas, tingidas na hora.
(() => {
  'use strict';
  const MS = window.MS = window.MS || {};

  MS.makeGL = function (cv, opt = {}) {
    let gl = null;
    const attrs = { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, depth: false, stencil: false };
    try { gl = cv.getContext('webgl', attrs) || cv.getContext('experimental-webgl', attrs); } catch (_) { gl = null; }
    if (!gl) return null;

    const VS = `attribute vec2 p; attribute vec2 uv; attribute vec4 c; uniform vec2 sz; varying vec2 vUv; varying vec4 vC;
      void main(){ vUv = uv; vC = c; gl_Position = vec4(p.x / sz.x * 2.0 - 1.0, 1.0 - p.y / sz.y * 2.0, 0, 1); }`;
    const FS = `precision mediump float; uniform sampler2D t; varying vec2 vUv; varying vec4 vC; void main(){ gl_FragColor = texture2D(t, vUv) * vC; }`;
    const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);

    // lote: 4 vértices por retângulo (x, y, u, v, r, g, b, a) + índices
    const MAXQ = 8000, STRIDE = 8, data = new Float32Array(MAXQ * 4 * STRIDE);
    const idx = new Uint16Array(MAXQ * 6);
    for (let i = 0; i < MAXQ; i++) { const o = i * 6, v = i * 4; idx[o] = v; idx[o + 1] = v + 1; idx[o + 2] = v + 2; idx[o + 3] = v; idx[o + 4] = v + 2; idx[o + 5] = v + 3; }
    const vbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    const ibuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    const loc = n => gl.getAttribLocation(pr, n), locP = loc('p'), locUV = loc('uv'), locC = loc('c');
    gl.enableVertexAttribArray(locP); gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(locUV); gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, STRIDE * 4, 8);
    gl.enableVertexAttribArray(locC); gl.vertexAttribPointer(locC, 4, gl.FLOAT, false, STRIDE * 4, 16);
    const uSz = gl.getUniformLocation(pr, 'sz');
    gl.uniform2f(uSz, 800, 500);                         // coordenadas do palco (800 × 500), qualquer resolução
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const maxTex = Math.min(8192, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048);
    const stats = { quads: 0, draws: 0, svgQ: 0 };

    // ---------- texturas ----------
    function mkTex(src, w, h, smooth = true) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const f = smooth ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      cur = null;
      return { t, w: src ? src.width : w, h: src ? src.height : h };
    }
    const texs = {};
    function setTex(key, src) {                      // cria ou troca a textura de uma camada inteira
      flush();
      const old = texs[key];
      if (old) gl.deleteTexture(old.t);
      texs[key] = mkTex(src);
      return texs[key];
    }
    function dropTex(key) { const o = texs[key]; if (o) { flush(); gl.deleteTexture(o.t); delete texs[key]; } }
    const tmp = document.createElement('canvas');
    // atualiza só um pedaço (ex.: buraco no terreno); (x, y) no canvas de origem, (ox, oy) = canto da textura no canvas
    function subTex(key, src, x, y, w, h, ox = 0, oy = 0) {
      const T = texs[key]; if (!T || w <= 0 || h <= 0) return;
      let x0 = Math.max(ox, Math.floor(x)), y0 = Math.max(oy, Math.floor(y));
      const x1 = Math.min(ox + T.w, Math.ceil(x + w)), y1 = Math.min(oy + T.h, Math.ceil(y + h));
      const ww = x1 - x0, hh = y1 - y0;
      if (ww <= 0 || hh <= 0) return;
      flush();
      tmp.width = ww; tmp.height = hh; const c = tmp.getContext('2d'); c.clearRect(0, 0, ww, hh); c.drawImage(src, x0, y0, ww, hh, 0, 0, ww, hh);
      gl.bindTexture(gl.TEXTURE_2D, T.t); gl.texSubImage2D(gl.TEXTURE_2D, 0, x0 - ox, y0 - oy, gl.RGBA, gl.UNSIGNED_BYTE, tmp);
      cur = null;
    }
    // textura feita de um pedaço de um canvas grande (terreno dividido em faixas que cabem na placa)
    function setTexPart(key, src, x, y, w, h) {
      flush();
      const old = texs[key]; if (old) gl.deleteTexture(old.t);
      tmp.width = w; tmp.height = h; const c = tmp.getContext('2d'); c.clearRect(0, 0, w, h); c.drawImage(src, x, y, w, h, 0, 0, w, h);
      texs[key] = mkTex(tmp);
      tmp.width = 1; tmp.height = 1;
      return texs[key];
    }

    // ---------- atlas: páginas de 2048² onde os desenhos pequenos são guardados ----------
    const PS = Math.min(2048, maxTex), MAXP = 5, PAD = 2;
    let pages = [], gen = 0;
    function newPage() { const T = mkTex(null, PS, PS); const pg = { T, x: 0, y: 0, rowH: 0 }; pages.push(pg); return pg; }
    function resetAtlas() {
      flush();
      for (const pg of pages) gl.deleteTexture(pg.T.t);
      pages = []; gen++;
      svgCache.clear(); textCache.clear(); cvCache.clear();
      for (const e of loading) e.dead = true;
      loading.length = 0; queue.length = 0;
    }
    function alloc(w, h) {
      if (w + PAD * 2 > PS || h + PAD * 2 > PS) return null;
      for (let pass = 0; pass < 2; pass++) {
        for (const pg of pages) {
          if (pg.x + w + PAD * 2 > PS) { pg.x = 0; pg.y += pg.rowH; pg.rowH = 0; }
          if (pg.y + h + PAD * 2 <= PS) {
            const r = { pg, x: pg.x + PAD, y: pg.y + PAD };
            pg.x += w + PAD * 2; pg.rowH = Math.max(pg.rowH, h + PAD * 2);
            return r;
          }
        }
        if (pages.length < MAXP) { newPage(); continue; }
        if (pass === 0) { resetAtlas(); newPage(); }     // atlas cheio: recomeça (os desenhos são refeitos quando aparecem)
      }
      return null;
    }
    // envia um canvas para o atlas; box = área em unidades locais [x, y, w, h]
    function putSprite(src, w, h, box) {
      const r = alloc(w, h); if (!r) return null;
      flush();
      gl.bindTexture(gl.TEXTURE_2D, r.pg.T.t);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, gl.RGBA, gl.UNSIGNED_BYTE, src);
      cur = null;
      return { T: r.pg.T, u0: r.x / PS, v0: r.y / PS, u1: (r.x + w) / PS, v1: (r.y + h) / PS,
               x0: box[0], y0: box[1], x1: box[0] + box[2], y1: box[1] + box[3], gen };
    }
    const scratch = document.createElement('canvas');
    function scratchCtx(w, h) { scratch.width = w; scratch.height = h; const c = scratch.getContext('2d'); c.clearRect(0, 0, w, h); return c; }

    // desenhos feitos com canvas 2D (círculo, anel, estrela…), feitos na hora e guardados
    const cvCache = new Map();
    function cvSprite(key, w, h, box, draw) {
      let s = cvCache.get(key);
      if (s && s.gen === gen) return s;
      const c = scratchCtx(w, h); draw(c, w, h);
      s = putSprite(scratch, w, h, box);
      if (s) cvCache.set(key, s);
      return s;
    }

    // ---------- desenhos SVG → imagem (assíncrono: o navegador decodifica e a gente envia aos poucos) ----------
    const svgCache = new Map(), queue = [], loading = [];
    let svgDefs = opt.defsFor || (() => '');
    function svg(key, snippet, box, res) {
      let e = svgCache.get(key);
      if (e) { e.used = frameN; return e.s; }
      const w = Math.max(1, Math.ceil(box[2] * res)), h = Math.max(1, Math.ceil(box[3] * res));
      if (w > PS - 8 || h > PS - 8) return null;
      e = { key, s: null, st: 0, w, h, box: [box[0], box[1], w / res, h / res], used: frameN, gen };
      if (typeof snippet === 'function') snippet = snippet();      // o desenho só é montado quando ainda não existe
      e.src = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${e.box.map(v => +v.toFixed(3)).join(' ')}" preserveAspectRatio="none" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">${svgDefs(snippet)}${snippet}</svg>`;
      svgCache.set(key, e); queue.push(e);
      return null;
    }
    const has = key => { const e = svgCache.get(key); return !!(e && e.s); };
    function startLoads(max = 6) {
      while (loading.length < max && queue.length) {
        const e = queue.shift();
        if (e.gen !== gen) continue;
        const im = new Image();
        e.st = 1; e.img = im; loading.push(e);
        im.onload = () => { e.st = 2; };
        im.onerror = () => { e.st = 3; };
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(e.src);
      }
    }
    // chamado no fim de cada quadro: envia as imagens prontas ao atlas, sem passar do tempo combinado
    function pump(budgetMs = 4) {
      const t0 = performance.now(), maxL = budgetMs > 20 ? 16 : 6;
      startLoads(maxL);
      for (let i = 0; i < loading.length; i++) {
        const e = loading[i];
        if (e.dead || e.gen !== gen || e.st === 3) { loading.splice(i--, 1); if (e.st === 3) svgCache.delete(e.key); continue; }
        if (e.st !== 2) continue;
        const c = scratchCtx(e.w, e.h);
        try { c.drawImage(e.img, 0, 0, e.w, e.h); e.s = putSprite(scratch, e.w, e.h, e.box); } catch (_) { svgCache.delete(e.key); }
        e.img = null; e.src = null; loading.splice(i--, 1);
        if (performance.now() - t0 > budgetMs) break;
      }
      startLoads(maxL);
      stats.svgQ = queue.length + loading.length;
    }

    // ---------- textos (canvas 2D) ----------
    const textCache = new Map();
    const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    // parts: texto simples ou lista [{t, fill}]; o ponto (0,0) é a linha de base, como no <text> do SVG
    function textSprite(parts, size, fill, stroke, sw, weight, anchor, res, ls) {
      if (typeof parts === 'string') parts = [{ t: parts, fill }];
      const rq = Math.max(0.5, Math.round(res * 4) / 4);
      const key = parts.map(p => p.t + '\u0001' + (p.fill || fill) + '\u0001' + (p.dx || 0)).join('\u0002') + '|' + size + '|' + fill + '|' + stroke + '|' + sw + '|' + weight + '|' + anchor + '|' + rq + '|' + (ls || 0);
      let s = textCache.get(key);
      if (s && s.gen === gen) return s;
      const px = size * rq, font = `${weight || 'normal'} ${px}px ${FONT}`;
      const m = scratch.getContext('2d'); m.font = font;
      const widths = parts.map(p => m.measureText(p.t).width + (ls || 0) * rq * p.t.length + (p.dx || 0) * rq);
      const tw = widths.reduce((a, b) => a + b, 0), pad = Math.ceil((sw || 0) * rq + 2);
      const asc = Math.ceil(px * 1.0), desc = Math.ceil(px * 0.32);
      const w = Math.ceil(tw + pad * 2), h = asc + desc + pad * 2;
      const c = scratchCtx(w, h);
      c.font = font; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
      if (ls && 'letterSpacing' in c) c.letterSpacing = (ls * rq) + 'px';
      let x = pad;
      parts.forEach((p, i) => {
        x += (p.dx || 0) * rq;
        if (stroke && sw) { c.strokeStyle = stroke; c.lineWidth = sw * rq * 2; c.strokeText(p.t, x, pad + asc); }
        c.fillStyle = p.fill || fill; c.fillText(p.t, x, pad + asc);
        x += widths[i] - (p.dx || 0) * rq;
      });
      const ox = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w + pad : -pad;
      s = putSprite(scratch, w, h, [ox / rq, -(pad + asc) / rq, w / rq, h / rq]);
      if (s) { if (textCache.size > 400) textCache.clear(); textCache.set(key, s); }
      return s;
    }

    // ---------- texturas básicas: branco, disco, anéis, estrela ----------
    let white, disc;
    const rings = {};
    function basics() {
      white = cvSprite('white', 4, 4, [0, 0, 1, 1], c => { c.fillStyle = '#fff'; c.fillRect(0, 0, 4, 4); });
      if (white) { const du = (white.u1 - white.u0) / 2, dv = (white.v1 - white.v0) / 2; white = { ...white, u0: white.u0 + du * 0.8, u1: white.u1 - du * 0.8, v0: white.v0 + dv * 0.8, v1: white.v1 - dv * 0.8 }; }
      disc = cvSprite('disc', 128, 128, [-1, -1, 2, 2], c => { c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 64, 63, 0, 7); c.fill(); });
    }
    function ringSpr(ratio) {        // ratio = espessura / raio
      const k = ratio < 0.06 ? 0.04 : ratio < 0.11 ? 0.08 : ratio < 0.2 ? 0.15 : ratio < 0.35 ? 0.28 : 0.45;
      let s = rings[k];
      if (s && s.gen === gen) return { s, k };
      s = cvSprite('ring' + k, 192, 192, [-1, -1, 2, 2], c => {
        const R = 95 / (1 + k / 2), lw = R * k;
        c.strokeStyle = '#fff'; c.lineWidth = lw; c.beginPath(); c.arc(96, 96, R, 0, 7); c.stroke();
      });
      rings[k] = s;
      return { s, k };
    }

    // ---------- cores ----------
    const colCache = new Map();
    function parseCol(str) {
      let c = colCache.get(str);
      if (c) return c;
      c = [1, 1, 1, 1];
      if (str && str[0] === '#') {
        let h = str.slice(1); if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
        c = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
      } else if (str) {
        const m = str.match(/rgba?\(([^)]+)\)/);
        if (m) { const p = m[1].split(',').map(Number); c = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1]; }
        else if (str === 'none' || str === 'transparent') c = [0, 0, 0, 0];
        else if (str === 'white') c = [1, 1, 1, 1]; else if (str === 'black') c = [0, 0, 0, 1];
      }
      colCache.set(str, c);
      return c;
    }

    // ---------- transformação atual (matriz 2D) ----------
    let ma = 1, mb = 0, mc = 0, md = 1, me = 0, mf = 0, ga = 1;
    const stack = [];
    const R = {
      gl, maxTex, stats, get gen() { return gen; },
      res: 2,                                            // pixels por unidade usados nos desenhos novos
      setBase(z, ox, oy) { ma = z; mb = 0; mc = 0; md = z; me = ox; mf = oy; stack.length = 0; ga = 1; },
      push() { stack.push(ma, mb, mc, md, me, mf, ga); },
      pop() { ga = stack.pop(); mf = stack.pop(); me = stack.pop(); md = stack.pop(); mc = stack.pop(); mb = stack.pop(); ma = stack.pop(); },
      tr(x, y) { me += ma * x + mc * y; mf += mb * x + md * y; },
      rot(a) { if (!a) return; const c = Math.cos(a), s = Math.sin(a); const na = ma * c + mc * s, nb = mb * c + md * s, nc = mc * c - ma * s, nd = md * c - mb * s; ma = na; mb = nb; mc = nc; md = nd; },
      sc(x, y = x) { ma *= x; mb *= x; mc *= y; md *= y; },
      alpha(a) { ga *= a; },
      get zoom() { return Math.sqrt(Math.abs(ma * md - mb * mc)); },
      setTex, setTexPart, dropTex, subTex, tex: k => texs[k], svg, has, cvSprite, pump, resetAtlas, parseCol,
      resize(w, h) { gl.viewport(0, 0, w, h); },
      begin(r = 0, g = 0, b = 0) {
        stats.quads = 0; stats.draws = 0; frameN++;
        if (!white || white.gen !== gen || !disc || disc.gen !== gen) basics();
        gl.clearColor(r, g, b, 1); gl.clear(gl.COLOR_BUFFER_BIT); cur = null; n = 0;
      },
      end() { flush(); },
      lost: () => gl.isContextLost()
    };
    let frameN = 0;

    // ---------- o lote ----------
    let n = 0, cur = null;
    function flush() {
      if (!n || !cur) { n = 0; return; }
      gl.bindTexture(gl.TEXTURE_2D, cur.t);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, n * 4 * STRIDE));
      gl.drawElements(gl.TRIANGLES, n * 6, gl.UNSIGNED_SHORT, 0);
      n = 0; stats.draws++;
    }
    // 4 cantos em coordenadas locais (passam pela matriz) + recorte da textura + cor (já multiplicada pelo alfa)
    const okB = () => { if (!white || white.gen !== gen || !disc || disc.gen !== gen) basics(); return !!(white && disc); };
    function emit(T, x0, y0, x1, y1, x2, y2, x3, y3, u0, v0, u1, v1, r, g, b, a) {
      if (a <= 0.002) return;
      if (cur !== T) { flush(); cur = T; }
      if (n >= MAXQ) flush();
      let o = n * 4 * STRIDE;
      const put = (x, y, u, v) => {
        data[o++] = ma * x + mc * y + me; data[o++] = mb * x + md * y + mf; data[o++] = u; data[o++] = v;
        data[o++] = r; data[o++] = g; data[o++] = b; data[o++] = a;
      };
      put(x0, y0, u0, v0); put(x1, y1, u1, v0); put(x2, y2, u1, v1); put(x3, y3, u0, v1);
      n++; stats.quads++;
    }
    // cor: tinta (string) * alfa; sem tinta = branco (a imagem como ela é)
    function rgba(col, a) {
      a *= ga;
      if (!col) return [a, a, a, a];
      const c = parseCol(col), aa = a * c[3];
      return [c[0] * aa, c[1] * aa, c[2] * aa, aa];
    }
    // imagem (sprite) na sua área local; flip/escala via matriz
    R.spr = (s, a = 1, col) => {
      if (!s || s.gen !== gen) return false;
      const k = rgba(col, a);
      emit(s.T, s.x0, s.y0, s.x1, s.y0, s.x1, s.y1, s.x0, s.y1, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
      return true;
    };
    // textura de camada inteira: recorte (pixels) → retângulo local
    R.img = (key, sx, sy, sw, sh, x, y, w, h, a = 1) => {
      const T = texs[key]; if (!T) return false;
      const k = rgba(null, a);
      emit(T, x, y, x + w, y, x + w, y + h, x, y + h, sx / T.w, sy / T.h, (sx + sw) / T.w, (sy + sh) / T.h, k[0], k[1], k[2], k[3]);
      return true;
    };
    // quadrilátero livre com uma faixa vertical da textura (água com ondas)
    R.quad4 = (key, x0, y0, x1, y1, x2, y2, x3, y3, v0a, v0b, v1, a = 1) => {
      const T = texs[key]; if (!T) return;
      const k = rgba(null, a);
      if (cur !== T) { flush(); cur = T; }
      if (n >= MAXQ) flush();
      let o = n * 4 * STRIDE;
      const put = (x, y, u, v) => { data[o++] = ma * x + mc * y + me; data[o++] = mb * x + md * y + mf; data[o++] = u; data[o++] = v; data[o++] = k[0]; data[o++] = k[1]; data[o++] = k[2]; data[o++] = k[3]; };
      put(x0, y0, 0.5, v0a); put(x1, y1, 0.5, v0b); put(x2, y2, 0.5, v1); put(x3, y3, 0.5, v1);
      n++; stats.quads++;
    };
    R.rect = (x, y, w, h, col, a = 1) => {
      if (!okB()) return;
      const k = rgba(col, a), s = white;
      emit(s.T, x, y, x + w, y, x + w, y + h, x, y + h, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
    };
    R.tri = (x0, y0, x1, y1, x2, y2, col, a = 1) => {
      if (!okB()) return;
      const k = rgba(col, a), s = white;
      emit(s.T, x0, y0, x1, y1, x2, y2, x2, y2, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
    };
    R.ellipse = (x, y, rx, ry, col, a = 1) => {
      if (!okB()) return;
      if (rx <= 0 || ry <= 0) return;
      const k = rgba(col, a), s = disc, ex = rx * 64 / 63, ey = ry * 64 / 63;
      emit(s.T, x - ex, y - ey, x + ex, y - ey, x + ex, y + ey, x - ex, y + ey, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
    };
    R.circle = (x, y, r, col, a = 1) => R.ellipse(x, y, r, r, col, a);
    R.ring = (x, y, r, sw, col, a = 1) => {
      if (r <= 0 || sw <= 0) return;
      const { s, k: kk } = ringSpr(sw / r); if (!s) return;
      const outer = r + sw / 2, k = rgba(col, a), e = outer * 96 / 95;
      emit(s.T, x - e, y - e, x + e, y - e, x + e, y + e, x - e, y + e, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
      void kk;
    };
    // linha com pontas redondas (meio-disco + retângulo + meio-disco: sem sobreposição)
    R.line = (x1, y1, x2, y2, w, col, a = 1, round = true) => {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (w <= 0) return;
      if (!okB()) return;
      const k = rgba(col, a), h = w / 2;
      if (L < 0.01) { if (round) R.circle(x1, y1, h, col, a); return; }
      const ux = dx / L * h, uy = dy / L * h, nx = -uy, ny = ux;
      const s = white;
      emit(s.T, x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
      if (!round) return;
      const d = disc, um = (d.u0 + d.u1) / 2, e = 64 / 63;
      // meia-lua de trás (x1) e da frente (x2): a textura do disco cortada ao meio, girada na direção da linha
      emit(d.T, x1 + nx * e - ux * e, y1 + ny * e - uy * e, x1 + nx * e, y1 + ny * e, x1 - nx * e, y1 - ny * e, x1 - nx * e - ux * e, y1 - ny * e - uy * e,
           d.u0, d.v0, um, d.v1, k[0], k[1], k[2], k[3]);
      emit(d.T, x2 + nx * e, y2 + ny * e, x2 + nx * e + ux * e, y2 + ny * e + uy * e, x2 - nx * e + ux * e, y2 - ny * e + uy * e, x2 - nx * e, y2 - ny * e,
           um, d.v0, d.u1, d.v1, k[0], k[1], k[2], k[3]);
    };
    // linha quebrada (raios, rastros): segmentos com juntas redondas
    R.poly = (pts, w, col, a = 1) => {
      for (let i = 1; i < pts.length; i++) R.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w, col, a, false);
      for (let i = 1; i < pts.length - 1; i++) R.circle(pts[i][0], pts[i][1], w / 2, col, a);
    };
    R.dashed = (x1, y1, x2, y2, w, dash, gap, col, a = 1, round = false) => {
      const L = Math.hypot(x2 - x1, y2 - y1); if (L < 0.01) return;
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      for (let t = 0; t < L; t += dash + gap) { const t2 = Math.min(L, t + dash); R.line(x1 + ux * t, y1 + uy * t, x1 + ux * t2, y1 + uy * t2, w, col, a, round); }
    };
    R.pill = (x, y, w, h, col, a = 1) => {
      if (w <= 0) return;
      if (w <= h) { R.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, col, a); return; }
      R.line(x + h / 2, y + h / 2, x + w - h / 2, y + h / 2, h, col, a, true);
    };
    // retângulo de cantos redondos (painéis): miolo + 4 quartos de disco, sem sobreposição
    R.rrect = (x, y, w, h, r, col, a = 1) => {
      if (w <= 0 || h <= 0) return;
      r = Math.min(r, w / 2, h / 2);
      if (!okB()) return;
      R.rect(x + r, y, w - 2 * r, h, col, a); R.rect(x, y + r, r, h - 2 * r, col, a); R.rect(x + w - r, y + r, r, h - 2 * r, col, a);
      const k = rgba(col, a), d = disc, um = (d.u0 + d.u1) / 2, vm = (d.v0 + d.v1) / 2, e = r * 64 / 63;
      emit(d.T, x + r - e, y + r - e, x + r, y + r - e, x + r, y + r, x + r - e, y + r, d.u0, d.v0, um, vm, k[0], k[1], k[2], k[3]);
      emit(d.T, x + w - r, y + r - e, x + w - r + e, y + r - e, x + w - r + e, y + r, x + w - r, y + r, um, d.v0, d.u1, vm, k[0], k[1], k[2], k[3]);
      emit(d.T, x + r - e, y + h - r, x + r, y + h - r, x + r, y + h - r + e, x + r - e, y + h - r + e, d.u0, vm, um, d.v1, k[0], k[1], k[2], k[3]);
      emit(d.T, x + w - r, y + h - r, x + w - r + e, y + h - r, x + w - r + e, y + h - r + e, x + w - r, y + h - r + e, um, vm, d.u1, d.v1, k[0], k[1], k[2], k[3]);
    };
    // fatia de pizza (ângulos em graus, 0 = direita, sentido anti-horário como na tela do jogo)
    R.wedge = (cx, cy, r, a0, a1, col, a = 1) => {
      const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 12));
      for (let i = 0; i < n; i++) {
        const t0 = (a0 + (a1 - a0) * i / n) * Math.PI / 180, t1 = (a0 + (a1 - a0) * (i + 1) / n) * Math.PI / 180;
        R.tri(cx, cy, cx + Math.cos(t0) * r, cy - Math.sin(t0) * r, cx + Math.cos(t1) * r, cy - Math.sin(t1) * r, col, a);
      }
    };
    // degradê horizontal (barra de força)
    R.hgrad = (x, y, w, h, stops, a = 1) => {
      const key = 'hg|' + stops.join(',');
      const s = cvSprite(key, 256, 4, [0, 0, 1, 1], c => { const g = c.createLinearGradient(0, 0, 256, 0); stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col)); c.fillStyle = g; c.fillRect(0, 0, 256, 4); });
      if (!s) return;
      const k = rgba(null, a), du = (s.u1 - s.u0) / 256, dv = (s.v1 - s.v0) / 2;
      emit(s.T, x, y, x + w, y, x + w, y + h, x, y + h, s.u0 + du, s.v0 + dv, s.u1 - du, s.v0 + dv, k[0], k[1], k[2], k[3]);
    };
    // texto: (x, y) = linha de base; o = { size, fill, stroke, sw, weight, anchor, ls }
    R.text = (str, x, y, o = {}, a = 1) => {
      if (str === '' || str === undefined || str === null) return;
      const s = textSprite(typeof str === 'string' ? str : str, o.size || 12, o.fill || '#fff', o.stroke || '', o.sw || 0, o.weight || 'bold', o.anchor || 'middle', R.res * (o.res || 1), o.ls || 0);
      if (!s) return;
      R.push(); R.tr(x, y); R.spr(s, a); R.pop();
    };
    R.star = (x, y, sc, a = 1) => {       // brilho de shiny (estrela de 4 pontas)
      const s = cvSprite('star', 48, 48, [-6, -6, 12, 12], c => {
        c.translate(24, 24); c.scale(4, 4); c.beginPath();
        c.moveTo(0, -5); c.lineTo(1.3, -1.3); c.lineTo(5, 0); c.lineTo(1.3, 1.3); c.lineTo(0, 5); c.lineTo(-1.3, 1.3); c.lineTo(-5, 0); c.lineTo(-1.3, -1.3); c.closePath();
        c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#ffe27a'; c.lineWidth = 0.7; c.stroke();
      });
      R.push(); R.tr(x, y); R.sc(sc); R.spr(s, a); R.pop();
    };
    // ---------- brilho aditivo (luz de fogo, raios, explosões) ----------
    let additive = false;
    R.add = on => { if (on === additive) return; flush(); additive = on; gl.blendFunc(gl.ONE, on ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); };
    R.glow = (x, y, r, col, a = 1) => {
      if (r <= 0) return;
      const s = cvSprite('glow', 128, 128, [-1, -1, 2, 2], c => {
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(0.6, 'rgba(255,255,255,.15)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 128, 128);
      });
      if (!s) return;
      const k = rgba(col, a);
      emit(s.T, x - r, y - r, x + r, y - r, x + r, y + r, x - r, y + r, s.u0, s.v0, s.u1, s.v1, k[0], k[1], k[2], k[3]);
    };

    // ---------- terreno calculado pela placa de vídeo ----------
    // textura de dados (1 texel = 1 unidade do mundo): R = chão, G = profundidade abaixo do ar, A = queimado
    // textura de colunas (W × 1): R = grama, G = altura do capim, B/A = altura do topo
    const TVS = `attribute vec2 p; attribute vec2 w; uniform vec2 sz; varying vec2 vw;
      void main(){ vw = w; gl_Position = vec4(p.x / sz.x * 2.0 - 1.0, 1.0 - p.y / sz.y * 2.0, 0, 1); }`;
    const TFS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D D; uniform sampler2D C; uniform vec2 S; uniform float e;
      uniform vec3 d0, d1, d2, s1, s2, g0, g1, g2; uniform vec2 dy, ph; uniform float tx;
      uniform vec4 L[4]; uniform vec3 LC[4];
      varying vec2 vw;
      float solidAt(vec2 p){ return texture2D(D, p / S).r; }
      float topAt(float x){ vec4 c = texture2D(C, vec2((floor(x) + 0.5) / S.x, 0.5)); return c.b * 255.0 + c.a * 65280.0; }
      float topL(float x){ float xx = x - 0.5, f = fract(xx), x0 = floor(xx); return mix(topAt(x0), topAt(x0 + 1.0), f); }
      vec4 colAt(float x){ return texture2D(C, vec2((floor(x) + 0.5) / S.x, 0.5)); }
      float band(float v, float hw){ return 1.0 - smoothstep(hw - e, hw + e, abs(v)); }
      vec4 over(vec4 o, vec3 c, float a){ return vec4(c * a, a) + o * (1.0 - a); }
      float ell(vec2 q, vec2 c, vec2 r){ vec2 d = (q - c) / r; return 1.0 - smoothstep(0.8, 1.0, dot(d, d)); }
      float seg(vec2 q, vec2 a, vec2 b, float w){ vec2 ab = b - a, aq = q - a; float t = clamp(dot(aq, ab) / dot(ab, ab), 0.0, 1.0); return 1.0 - smoothstep(w - e, w + e, length(aq - ab * t)); }
      vec3 dirt(float y){ float t = clamp((y - dy.x) / (dy.y - dy.x), 0.0, 1.0); return t < 0.45 ? mix(d0, d1, t / 0.45) : mix(d1, d2, (t - 0.45) / 0.55); }
      vec3 pebbles(vec3 c, vec2 p){
        vec2 q = vec2(mod(p.x, 48.0), mod(p.y, 40.0));
        c = mix(c, vec3(0.18, 0.106, 0.055), 0.35 * ell(q, vec2(8.0, 9.0), vec2(3.5, 2.2)));
        c = mix(c, vec3(0.69, 0.54, 0.384), 0.35 * ell(q, vec2(30.0, 22.0), vec2(4.5, 2.8)));
        c = mix(c, vec3(0.18, 0.106, 0.055), 0.4 * ell(q, vec2(40.0, 6.0), vec2(2.0, 1.4)));
        c = mix(c, vec3(0.77, 0.6, 0.42), 0.3 * ell(q, vec2(16.0, 32.0), vec2(2.6, 1.8)));
        c = mix(c, vec3(0.12, 0.07, 0.04), 0.45 * ell(q, vec2(24.0, 12.0), vec2(1.0, 1.0)));
        c = mix(c, vec3(0.12, 0.07, 0.04), 0.4 * ell(q, vec2(44.0, 34.0), vec2(1.2, 1.2)));
        c = mix(c, vec3(0.85, 0.72, 0.55), 0.45 * ell(q, vec2(4.0, 24.0), vec2(0.9, 0.9)));
        return c;
      }
      // veio de madeira (cozinha): faixas onduladas + nós
      vec3 wood(vec3 c, vec2 p){
        float v = p.y * 0.42 + sin(p.x * 0.021 + ph.x) * 3.2 + sin(p.x * 0.0063 + ph.y) * 7.0;
        float g = abs(fract(v / 6.2832) - 0.5) * 2.0;
        c = mix(c, c * 0.72, 0.55 * smoothstep(0.82, 0.97, g));
        c = mix(c, c * 1.12, 0.35 * (1.0 - smoothstep(0.0, 0.25, g)));
        vec2 q = vec2(mod(p.x + 37.0, 173.0), mod(p.y + 11.0, 61.0));
        c = mix(c, c * 0.6, 0.6 * ell(q, vec2(80.0, 30.0), vec2(5.0, 2.6)));
        c = mix(c, c * 0.8, 0.5 * ell(q, vec2(80.0, 30.0), vec2(9.0, 4.4)) * (1.0 - ell(q, vec2(80.0, 30.0), vec2(5.0, 2.6))));
        return c;
      }
      // cocô do rola-bosta: marrom com caroços e brilho
      vec3 dung(vec2 p, float dep){
        vec3 c = mix(vec3(0.40, 0.25, 0.09), vec3(0.24, 0.14, 0.05), clamp(dep / 40.0, 0.0, 1.0));
        vec2 q = vec2(mod(p.x, 14.0), mod(p.y + floor(p.x / 14.0) * 5.0, 11.0));
        c = mix(c, c * 1.35, 0.7 * ell(q, vec2(5.0, 4.0), vec2(4.0, 2.4)));
        c = mix(c, vec3(0.62, 0.46, 0.24), 0.45 * ell(q, vec2(4.0, 3.2), vec2(1.6, 0.8)));
        c = mix(c, c * 0.7, 0.5 * ell(q, vec2(10.0, 8.0), vec2(2.4, 1.4)));
        float h = fract(sin(dot(floor(p * 0.6), vec2(12.9898, 78.233))) * 43758.5453);
        if (h > 0.93) c = mix(c, vec3(0.86, 0.80, 0.55), 0.6);      // sementinhas
        return c;
      }
      // areia: grãos finos
      vec3 sand(vec3 c, vec2 p){
        float h = fract(sin(dot(floor(p * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
        return mix(c, h > 0.5 ? c * 1.1 : c * 0.9, 0.35);
      }
      // concreto/asfalto: blocos com juntas e pedrisco
      vec3 blocks(vec3 c, vec2 p){
        float row = floor(p.y / 22.0), x = p.x + mod(row, 2.0) * 26.0;
        float jx = abs(mod(x, 52.0) - 0.5), jy = abs(mod(p.y, 22.0) - 0.5);
        c = mix(c, c * 0.72, 0.7 * (1.0 - smoothstep(0.8, 1.6, min(jx, jy))));
        float h = fract(sin(dot(floor(p * 0.7), vec2(12.9898, 78.233))) * 43758.5453);
        return mix(c, c * (0.86 + h * 0.28), 0.5);
      }
      void main(){
        vec2 w = vw;
        vec4 d = texture2D(D, w / S);
        vec2 wb = w + vec2(-7.0, 9.0);
        float rb = solidAt(wb);
        float top = topL(w.x), dyT = w.y - top;
        float topB = topL(wb.x), dyB = wb.y - topB;
        if (d.r < 0.01 && rb < 0.01 && abs(dyT) > 12.0 && abs(dyB) > 6.0) discard;
        vec4 o = vec4(0.0);
        // fatia de trás (espessura 2.5D)
        float sb = smoothstep(0.5 - e, 0.5 + e, rb);
        o = over(o, vec3(0.239, 0.157, 0.094), sb);
        vec4 cb = colAt(wb.x);
        if (topB < 478.0) {
          if (cb.r > 0.5) o = over(o, g0, band(dyB, 3.0));
          else o = over(o, vec3(0.1, 0.063, 0.039), band(dyB, 2.0));
        }
        // frente: terra com degradê, pedrinhas, camadas de rocha, queimado e contorno escuro
        float s = smoothstep(0.5 - e, 0.5 + e, d.r);
        if (s > 0.0) {
          vec3 c = d.b > 0.5 ? dung(w, d.g * 255.0) : tx > 2.5 ? blocks(dirt(w.y), w) : tx > 1.5 ? sand(dirt(w.y), w) : tx > 0.5 ? wood(dirt(w.y), w) : pebbles(dirt(w.y), w);
          float dep = d.g * 255.0;
          if (dep > 48.0 + 8.0 * sin(w.x * 0.05 + ph.y)) c = mix(c, s1, 0.5);
          if (dep > 115.0 + 12.0 * sin(w.x * 0.03 + ph.x)) c = mix(c, s2, 0.7);
          c = mix(c, vec3(0.102, 0.059, 0.031), d.a * 0.42);
          float n4 = min(min(solidAt(w + vec2(1.4, 0.0)), solidAt(w - vec2(1.4, 0.0))), min(solidAt(w + vec2(0.0, 1.4)), solidAt(w - vec2(0.0, 1.4))));
          c = mix(c, vec3(0.118, 0.075, 0.043), 0.55 * clamp(1.0 - n4 * 1.6, 0.0, 1.0));
          o = over(o, c, s);
        }
        // borda de cima: grama (com brilho e capim) ou queimado
        vec4 cc = colAt(w.x);
        if (top < 478.0) {
          if (cc.r > 0.5) {
            o = over(o, g0, band(dyT, 3.5));
            o = over(o, g1, band(dyT + 2.5, 1.0));
          } else o = over(o, vec3(0.118, 0.075, 0.043), band(dyT, 2.0));
        }
        float xb = floor((w.x - 3.0) / 7.0) * 7.0 + 3.0;
        vec4 ct = colAt(xb + 0.5);
        float tb = topAt(xb);
        if (ct.r > 0.5 && tb < 478.0 && abs(tb - topAt(xb - 1.0)) <= 4.0) {
          float t = ct.g * 12.75; vec2 b0 = vec2(xb, tb);
          float tf = max(max(seg(w, b0, b0 + vec2(-2.0, -t * 0.7), 0.65), seg(w, b0, b0 + vec2(0.6, -t), 0.65)), seg(w, b0, b0 + vec2(2.6, -t * 0.6), 0.65));
          o = over(o, g2, tf);
        }
        // luz das explosões e do fogo
        vec3 lit = vec3(0.0);
        for (int i = 0; i < 4; i++) { float dd = length(w - L[i].xy) / max(L[i].z, 1.0); lit += LC[i] * L[i].w * max(0.0, 1.0 - dd * dd); }
        o.rgb += o.rgb * lit;
        gl_FragColor = o;
      }`;
    let tp = null, tLoc = null, tBuf = null, tD = null, tC = null, tW = 0, tH = 0;
    function compile(type, src) {
      const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { R.terrErr = gl.getShaderInfoLog(sh); return null; }
      return sh;
    }
    function terrProgram() {
      if (tp !== null) return tp;
      const v = compile(gl.VERTEX_SHADER, TVS), f = compile(gl.FRAGMENT_SHADER, TFS);
      if (!v || !f) { tp = false; return tp; }
      const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f);
      gl.bindAttribLocation(p, 0, 'p'); gl.bindAttribLocation(p, 1, 'w');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { R.terrErr = gl.getProgramInfoLog(p); tp = false; return tp; }
      tp = p;
      const u = n => gl.getUniformLocation(p, n);
      tLoc = { tx: u('tx'), sz: u('sz'), D: u('D'), C: u('C'), S: u('S'), e: u('e'), d0: u('d0'), d1: u('d1'), d2: u('d2'), s1: u('s1'), s2: u('s2'),
               g0: u('g0'), g1: u('g1'), g2: u('g2'), dy: u('dy'), ph: u('ph'), L: u('L'), LC: u('LC') };
      tBuf = gl.createBuffer();
      return tp;
    }
    const rawTex = (w, h) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    R.terrOk = () => !!terrProgram();
    // envia o mapa inteiro (início da fase) ou só as colunas x0..x1 (explosão)
    R.terrData = (data, w, h, x0, x1) => {
      if (!terrProgram()) return;
      flush();
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (!tD || w !== tW || h !== tH) {
        if (tD) gl.deleteTexture(tD);
        tD = rawTex(); tW = w; tH = h;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, tD);
        if (x0 === undefined) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
        else {
          const cw = x1 - x0 + 1, part = new Uint8Array(cw * h * 4);
          for (let y = 0; y < h; y++) part.set(data.subarray((y * w + x0) * 4, (y * w + x1 + 1) * 4), y * cw * 4);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, x0, 0, cw, h, gl.RGBA, gl.UNSIGNED_BYTE, part);
        }
      }
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      cur = null;
    };
    R.terrCols = (cols, w) => {
      if (!terrProgram()) return;
      flush();
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (!tC) tC = rawTex();
      gl.bindTexture(gl.TEXTURE_2D, tC);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, cols);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      cur = null;
    };
    const hex3 = c => { const v = parseCol(c); return [v[0], v[1], v[2]]; };
    // desenha o terreno (retângulo 0..W × 0..H do mundo) com a matriz atual; o = cores do tema e luzes
    R.drawTerrain = o => {
      if (!terrProgram() || !tD || !tC) return false;
      flush();
      const W = tW, H = tH;
      const P = (x, y) => [ma * x + mc * y + me, mb * x + md * y + mf];
      const a = P(0, 0), b = P(W, 0), c = P(W, H), d = P(0, H);
      const v = new Float32Array([a[0], a[1], 0, 0, b[0], b[1], W, 0, c[0], c[1], W, H, a[0], a[1], 0, 0, c[0], c[1], W, H, d[0], d[1], 0, H]);
      gl.useProgram(tp);
      gl.bindBuffer(gl.ARRAY_BUFFER, tBuf); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STREAM_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
      gl.disableVertexAttribArray(2);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tC);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tD);
      gl.uniform1i(tLoc.D, 0); gl.uniform1i(tLoc.C, 1);
      gl.uniform2f(tLoc.sz, 800, 500); gl.uniform2f(tLoc.S, W, H);
      gl.uniform1f(tLoc.e, Math.min(0.5, Math.max(0.06, 0.6 / Math.max(0.1, Math.sqrt(Math.abs(ma * md - mb * mc)) * (o.px || 1)))));
      for (const k of ['d0', 'd1', 'd2', 's1', 's2', 'g0', 'g1', 'g2']) gl.uniform3fv(tLoc[k], hex3(o[k]));
      gl.uniform1f(tLoc.tx, o.tx || 0);
      gl.uniform2f(tLoc.dy, o.dy[0], o.dy[1]); gl.uniform2f(tLoc.ph, o.ph[0], o.ph[1]);
      const L = new Float32Array(16), LC = new Float32Array(12);
      (o.lights || []).slice(0, 4).forEach((l, i) => { L.set([l.x, l.y, l.r, l.k], i * 4); LC.set(hex3(l.col || '#ffb347'), i * 3); });
      gl.uniform4fv(tLoc.L, L); gl.uniform3fv(tLoc.LC, LC);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      stats.draws++;
      // volta ao programa dos lotes
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
      gl.enableVertexAttribArray(locP); gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, STRIDE * 4, 0);
      gl.enableVertexAttribArray(locUV); gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, STRIDE * 4, 8);
      gl.enableVertexAttribArray(locC); gl.vertexAttribPointer(locC, 4, gl.FLOAT, false, STRIDE * 4, 16);
      cur = null;
      return true;
    };
    return R;
  };
})();
