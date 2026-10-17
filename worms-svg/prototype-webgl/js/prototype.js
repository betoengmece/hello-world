/* Experimental PixiJS renderer. The battle rules remain in the isolated game.js copy. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), MS = window.MS;
  const limit = (v, a, b) => Math.max(a, Math.min(b, v));
  const color = (s, fallback = 0xffffff) => {
    if (typeof s === 'number') return s;
    if (!s || !/^#[0-9a-f]{3,8}$/i.test(s)) return fallback;
    if (s.length === 4) s = '#' + [...s.slice(1)].map(x => x + x).join('');
    return parseInt(s.slice(1, 7), 16);
  };
  const P = window.Proto = {
    mode: 'webgl', ready: false, loading: true, fpsLimit: 30, frames: [], costs: [], sessions: [],
    record(ms, ts) {
      const now = performance.now(); this.frames.push(now); this.costs.push(ms);
      if (this.costs.length > 300) this.costs.shift();
      while (this.frames.length && now - this.frames[0] > 1000) this.frames.shift();
      if (!this.lastStat || now - this.lastStat > 500) {
        this.lastStat = now; const avg = this.costs.reduce((a, b) => a + b, 0) / this.costs.length;
        $('labStats').textContent = `${this.frames.length} FPS · desenho ${avg.toFixed(1)} ms`;
      }
    },
    showSvg() { document.body.classList.remove('webgl'); },
    draw(s) { renderer.draw(s); }
  };
  let manifest, renderer, generation = 0, errorMessage = '';
  const atlases = new Map();
  const definitions = () => [...document.querySelectorAll('#game defs')].map(e => e.innerHTML).join('');
  const toImage = async svg => {
    const image = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try { await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Falha ao preparar um desenho SVG.')); image.src = url; }); return image; }
    finally { URL.revokeObjectURL(url); }
  };
  const svgImage = (body, viewBox, width, height) => toImage(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><defs>${definitions()}</defs>${body}</svg>`);
  async function atlas(sp, size) {
    const key = sp + ':' + size;
    if (atlases.has(key)) return atlases.get(key);
    const task = (async () => {
      const m = manifest.meta[sp]; if (!m) throw new Error('Pokémon sem desenho: ' + sp);
      const c = document.createElement('canvas'); c.width = size * 8; c.height = size * 3;
      const ctx = c.getContext('2d');
      // Decode once at load, then animate by swapping texture rectangles on the GPU.
      for (let i = 0; i < manifest.frames.length; i++) {
        const image = await svgImage(MS.Art.draw(sp, manifest.frames[i]), `${m.x} ${m.y} ${m.side} ${m.side}`, size, size);
        ctx.drawImage(image, i % 8 * size, Math.floor(i / 8) * size, size, size);
      }
      const base = PIXI.BaseTexture.from(c, { scaleMode: PIXI.SCALE_MODES.LINEAR, mipmap: PIXI.MIPMAP_MODES.OFF });
      const textures = Array.from({ length: 24 }, (_, i) => new PIXI.Texture(base, new PIXI.Rectangle(i % 8 * size, Math.floor(i / 8) * size, size, size)));
      return { m, textures, base, canvas: c };
    })();
    atlases.set(key, task);
    try { const result = await task; atlases.set(key, result); return result; } catch (e) { atlases.delete(key); throw e; }
  }
  function releaseAtlases(needed, size) {
    for (const [key, a] of atlases) if (!needed.has(key) || !key.endsWith(':' + size)) {
      if (a.base) { a.textures.forEach(t => t.destroy(false)); a.base.destroy(); a.canvas.width = a.canvas.height = 1; }
      atlases.delete(key);
    }
  }
  class Renderer {
    constructor() {
      PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;
      this.app = new PIXI.Application({ view: $('gpu'), width: 800, height: 500,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5), antialias: false,
        autoStart: false, sharedTicker: false, backgroundColor: 0x15263d, powerPreference: 'low-power' });
      this.app.stop();
      this.root = this.app.stage;
      this.background = new PIXI.Container(); this.root.addChild(this.background);
      this.world = new PIXI.Container(); this.root.addChild(this.world);
      this.terrainCanvas = document.createElement('canvas'); this.terrainContext = this.terrainCanvas.getContext('2d');
      this.terrainTexture = PIXI.Texture.from(this.terrainCanvas);
      this.terrain = new PIXI.Sprite(this.terrainTexture); this.world.addChild(this.terrain);
      this.pickLayer = new PIXI.Container(); this.world.addChild(this.pickLayer);
      this.unitLayer = new PIXI.Container(); this.world.addChild(this.unitLayer);
      this.shapes = new PIXI.Graphics(); this.world.addChild(this.shapes);
      this.textLayer = new PIXI.Container(); this.world.addChild(this.textLayer);
      this.weather = new PIXI.Container(); this.root.addChild(this.weather);
      this.flash = new PIXI.Graphics(); this.root.addChild(this.flash);
      this.unitMap = new Map(); this.floatPool = []; this.pickMap = new Map(); this.backTextures = [];
      this.weatherKey = ''; this.weatherGroups = [];
      this.app.view.addEventListener('webglcontextlost', event => {
        event.preventDefault(); fail(new Error('A TV perdeu o contexto WebGL. O teste mudou para SVG; reinicie para tentar novamente.'));
      });
    }
    clear() {
      if (this.deco) { this.deco.destroy(); this.deco = null; }
      for (const item of this.unitMap.values()) item.group.destroy({ children: true });
      this.unitMap.clear(); this.pickLayer.removeChildren().forEach(x => x.destroy({ children: true })); this.pickMap.clear();
      this.background.removeChildren().forEach(x => x.destroy({ children: true }));
      this.backTextures.forEach(x => x.destroy(true)); this.backTextures = [];
      this.floatPool.forEach(x => x.destroy()); this.floatPool = []; this.weatherKey = '';
    }
    async prepare(s, size, token) {
      this.clear(); this.size = size;
      const species = [...new Set(s.units.map(u => u.sp))], needed = new Set(species.map(sp => sp + ':' + size));
      releaseAtlases(needed, size);
      let done = 0;
      for (const sp of species) { await atlas(sp, size); if (token !== generation) return; $('loadDetail').textContent = `Preparando ${MS.SPECIES[sp].name} · ${++done}/${species.length}`; }
      // Static backgrounds are rasterized once. No SVG decoding runs in the draw loop.
      MS.Prototype.staticLayers();
      const layers = [ ['sSky', '0 0 800 500', 800, 500, 0, 0],
        ['sFar', `-80 0 ${s.W + 200} 500`, s.W + 200, 500, .25, -80],
        ['sNear', `-80 0 ${s.W + 200} 500`, s.W + 200, 500, .5, -80],
        ['sMid', `-80 0 ${s.W + 200} 500`, s.W + 200, 500, .65, -80] ];
      for (const [id, vb, w, h, depth, x] of layers) {
        const body = $(id).innerHTML;
        const image = await svgImage(body, vb, w, h); if (token !== generation) return;
        const texture = PIXI.Texture.from(image); this.backTextures.push(texture);
        const sprite = new PIXI.Sprite(texture); sprite.x = x; sprite.depth = depth; sprite.originX = x; this.background.addChild(sprite);
      }
      const deco = $('decor').innerHTML;
      if (deco) {
        const image = await svgImage(deco, `0 0 ${s.W} 500`, s.W, 500);
        const texture = PIXI.Texture.from(image); this.backTextures.push(texture);
        this.deco = new PIXI.Sprite(texture); this.world.addChildAt(this.deco, 1);
      }
      this.balls = {};
      for (const [kind, col] of [['ball','#f44747'],['great','#48a2ff'],['ultra','#ffd34d']]) {
        const image = await svgImage(MS.Art.ball(8, 0, 0, col), '-12 -12 24 24', 48, 48);
        const texture = PIXI.Texture.from(image); this.backTextures.push(texture); this.balls[kind] = texture;
      }
      MS.Prototype.invalidate(); this.updateTerrain(MS.Prototype.snapshot());
      this.app.renderer.textureGC.run();
    }
    updateTerrain(s) {
      if (!s.terrainDirty) return;
      const c = this.terrainCanvas, w = s.W, h = s.H;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = this.terrainContext, im = ctx.createImageData(w, h), data = im.data;
      const top = color(s.theme.dirt[0], 0x9b6d38), bottom = color(s.theme.dirt[2] || s.theme.dirt[1], 0x51311b);
      for (let y = 0; y < h; y++) {
        const t = limit((y - 170) / 330, 0, 1), rr = (top >> 16) * (1-t) + (bottom >> 16) * t,
          gg = (top >> 8 & 255) * (1-t) + (bottom >> 8 & 255) * t, bb = (top & 255) * (1-t) + (bottom & 255) * t;
        for (let x = 0; x < w; x++) {
          const j = y * w + x; if (!s.mask[j]) continue;
          const edge = y > 0 && !s.mask[j-w], grass = y < s.heights[x] + 5;
          const noise = ((x*17 + y*31) % 19 - 9) * .65, k = j*4;
          data[k] = grass ? 95 : rr + noise; data[k+1] = grass ? 143 : gg + noise; data[k+2] = grass ? 52 : bb + noise;
          if (edge) { data[k] *= .65; data[k+1] *= .65; data[k+2] *= .65; } data[k+3] = 255;
        }
      }
      ctx.putImageData(im, 0, 0); this.terrainTexture.baseTexture.update(); this.terrain.width = w; this.terrain.height = h;
      MS.Prototype.consumeTerrain();
    }
    getUnit(u) {
      if (this.unitMap.has(u.uid)) return this.unitMap.get(u.uid);
      const a = atlases.get(u.sp + ':' + this.size); if (!a || !a.textures) return null;
      const group = new PIXI.Container(), body = new PIXI.Container(), sprite = new PIXI.Sprite(a.textures[0]);
      sprite.position.set(a.m.x, a.m.y); sprite.width = sprite.height = a.m.side; body.addChild(sprite); group.addChild(body);
      const label = new PIXI.Text(u.name, { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: 0xffffff, stroke: 0x132031, strokeThickness: 2 });
      label.anchor.set(.5, 1); label.y = -(MS.SPECIES[u.sp].h*u.scale + 12); group.addChild(label);
      const item = { group, body, sprite, label }; this.unitMap.set(u.uid, item); this.unitLayer.addChild(group); return item;
    }
    drawWeather(s) {
      const key = s.weather || 'clear';
      if (key !== this.weatherKey) {
        this.weather.removeChildren().forEach(x => x.destroy()); this.weatherGroups = []; this.weatherKey = key;
        const shade = new PIXI.Graphics();
        if (key === 'rain' || key === 'storm') shade.beginFill(0x0a1a33, .22).drawRect(0, 0, 800, 500).endFill();
        if (key === 'snow') shade.beginFill(0xbcd8f0, .14).drawRect(0, 0, 800, 500).endFill();
        this.weather.addChild(shade);
        if (['rain','snow','storm'].includes(key)) for (let j = 0; j < 3; j++) {
          const g = new PIXI.Graphics();
          for (let i = 0; i < 22; i++) for (let copy = 0; copy < 2; copy++) {
            const x = (i*131.7+j*211)%880-40, y = (i*53+j*177)%540-20-copy*540;
            if (key === 'snow') g.beginFill(0xffffff, .6+j*.1).drawCircle(x,y,1.2+j*.7).endFill();
            else g.lineStyle(j === 2 ? 1.6 : 1.1, 0xcfe9ff, .3+j*.08).moveTo(x,y).lineTo(x-2,y+16);
          }
          this.weatherGroups.push(g); this.weather.addChild(g);
        }
      }
      this.weatherGroups.forEach((g,j) => { const snow = key === 'snow'; g.y = s.frameNo*(snow ? 1.1+j*.55 : 15+j*4.5)%540; g.x = snow ? Math.sin(s.frameNo*.03+j*2)*14 : 0; });
    }
    draw(s) {
      document.body.classList.add('webgl');
      this.updateTerrain(s);
      const cam = s.cam, z = cam.z;
      this.world.scale.set(z); this.world.position.set(400-(cam.x+cam.sx)*z, 250-(cam.y+cam.sy)*z);
      for (const sprite of this.background.children) {
        const f = sprite.depth, k = 1+(z-1)*f;
        sprite.scale.set(k); sprite.x = sprite.originX*k + 400-(400+(cam.x+cam.sx-400)*f)*k;
        sprite.y = 250-(250+(cam.y+cam.sy-250)*f)*k;
      }
      const g = this.shapes; g.clear();
      // Water and small particles are compact GPU geometry, not DOM elements.
      g.beginFill(color(s.theme.sea[2],0x3d9ac0),.88).moveTo(0,500);
      for(let x=0;x<=s.W;x+=20) g.lineTo(x,481+Math.sin(x*.045-s.frameNo*.05)*3);
      g.lineTo(s.W,500).closePath().endFill();
      for (const u of s.units) {
        const it = this.getUnit(u); if (!it) continue;
        it.group.visible = u.alive && !u.hidden; if (!it.group.visible) continue;
        const f = s.frameNo, frame = u.breath>0 ? 16+Math.min(5,Math.floor((18-u.breath)/3)) : (f+u.blinkOff)%230<7 ? 22+Math.floor(f/5)%2 : (u.moving||u.flying?8:0)+Math.floor(f/7.5)%8;
        const a = atlases.get(u.sp+':'+this.size); it.sprite.texture = a.textures[frame];
        const hop = u.hop ? -Math.abs(Math.sin(u.hop*.18))*16 : 0;
        it.group.position.set(u.x,u.y+hop-(u.lift||0)); it.body.scale.set(u.face*u.scale*u.capScale,u.scale*u.capScale);
        it.body.rotation = u.flying ? 0 : (u.tilt||0); it.body.alpha = u.hurt>0 && u.hurt%6<3 ? .45 : 1;
        it.label.visible = u.capScale>.5;
        const yy = it.group.y+it.label.y+4, hp = limit(u.hp/u.maxhp,0,1);
        g.beginFill(0x07111e,.7).drawRoundedRect(u.x-15,yy,30,5,2).endFill();
        g.beginFill(u.team===0?0x3a9bff:u.team===2?0xffd34d:0xe0433a).drawRoundedRect(u.x-14,yy+1,28*hp,3,1).endFill();
        if(u.shield>0) g.lineStyle(1.5,0xbff3ff,.7).drawCircle(u.x,u.y-MS.SPECIES[u.sp].hitY*u.scale,MS.SPECIES[u.sp].hitR*u.scale*1.75+4).lineStyle(0);
        if(u===s.active && s.state==='aim') { const y=yy-25+Math.sin(f*.15)*2;g.beginFill(0x69b8ff).drawPolygon([u.x-5,y,u.x+5,y,u.x,y+7]).endFill(); }
        if(u.hp/u.maxhp<=.35 && u.team!==0) g.lineStyle(1.5,0xffd34d).drawCircle(u.x,yy-15,4).lineStyle(0);
      }
      const livePick = new Set();
      for (const p of s.pickups) {
        livePick.add(p.id); let sprite = this.pickMap.get(p.id);
        if (!sprite) { sprite = new PIXI.Sprite(this.balls[p.type]||this.balls.ball);sprite.anchor.set(.5);sprite.width=sprite.height=15;this.pickMap.set(p.id,sprite);this.pickLayer.addChild(sprite); }
        sprite.position.set(p.x, s.heights[Math.round(p.x)]-12+Math.sin(s.frameNo*.08+p.ph)*3);
      }
      for(const [id,sprite] of this.pickMap) if(!livePick.has(id)){sprite.destroy();this.pickMap.delete(id);}
      if(s.mouth && (s.state==='aim'||s.state==='ai')) {
        const a=s.angle*Math.PI/180,m=s.mouth,x=m.x+Math.cos(a)*46,y=m.y-Math.sin(a)*46;
        g.lineStyle(1.5,0xffffff,.75);for(let t=0;t<1;t+=.16)g.moveTo(m.x+(x-m.x)*t,m.y+(y-m.y)*t).lineTo(m.x+(x-m.x)*Math.min(1,t+.08),m.y+(y-m.y)*Math.min(1,t+.08));
        g.lineStyle(1.5,s.ballMode?0xffd34d:0xff6565).drawCircle(x,y,6).moveTo(x-10,y).lineTo(x+10,y).moveTo(x,y-10).lineTo(x,y+10).lineStyle(0);
      }
      for(const p of s.projs){const c=color(p.wp.col || p.wp.color, p.kind==='ball'?0xffd34d:0xffc35b);g.beginFill(c,.35).drawCircle(p.x,p.y,9).endFill().beginFill(c).drawCircle(p.x,p.y,4).endFill();}
      for(const p of s.parts){const k=p.life/p.max,r=p.r+(p.kind==='smoke'?(1-k)*10:0);g.beginFill(color(p.col),limit(k*(p.kind==='smoke'?.4:1.2),0,1)).drawCircle(p.x,p.y,r).endFill();}
      for(const fx of s.fx){const k=fx.t/fx.max;if(fx.beam||fx.bolt){g.lineStyle(fx.beam?12:3,fx.beam?0xffd58c:0xffef77,1-k).moveTo(fx.x,fx.y).lineTo(fx.x2,fx.y2).lineStyle(0);}else if(fx.sky){g.lineStyle(3,0xffef77,1-k);fx.pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.lineStyle(0);}else{g.beginFill(color(fx.fill,0xffb54b),1-k).drawCircle(fx.x,fx.y,Math.max(1,fx.r*Math.min(1,k*1.6))).endFill();g.lineStyle(Math.max(.1,3*(1-k)),0xffffff,.8*(1-k)).drawCircle(fx.x,fx.y,Math.max(1,fx.r*k*1.4)).lineStyle(0);}}
      if(s.cap){const c=s.cap;g.beginFill(0xfff2a9,.8).drawCircle(c.x,c.by,7).endFill();}
      for(let i=0;i<s.floaters.length;i++){const f=s.floaters[i];let t=this.floatPool[i];if(!t){t=new PIXI.Text('',{fontFamily:'Arial',fontSize:15,fontWeight:'bold',stroke:0x101b2b,strokeThickness:2});t.anchor.set(.5);this.floatPool[i]=t;this.textLayer.addChild(t);}t.text=f.text;t.style.fill=f.col;t.position.set(f.x,f.y-f.t*.5);t.alpha=limit(1-f.t/60,0,1);t.visible=true;}
      for(let i=s.floaters.length;i<this.floatPool.length;i++)this.floatPool[i].visible=false;
      this.drawWeather(s); this.flash.clear();if(s.flash.a>.01)this.flash.beginFill(color(s.flash.col),s.flash.a).drawRect(0,0,800,500).endFill();
      this.app.renderer.render(this.root);
    }
  }
  function setMode(mode) {
    if(mode==='webgl'&&!renderer)return;
    if(P.costs.length) P.sessions.push({mode:P.mode,scenario:$('scenario').value,frames:P.frames.length,drawMs:P.costs.reduce((a,b)=>a+b,0)/P.costs.length,at:new Date().toISOString()});
    P.mode=mode;P.frames=[];P.costs=[];MS.Prototype.invalidate();
    $('webglMode').setAttribute('aria-pressed',String(mode==='webgl'));$('svgMode').setAttribute('aria-pressed',String(mode==='svg'));
    if(mode==='svg')P.showSvg();
    $('backend').textContent=mode==='webgl'?'PixiJS · WebGL · mundo na GPU · painel SVG':'SVG · renderização do jogo atual';
    document.activeElement?.blur();
  }
  function fail(error) {
    console.error(error); errorMessage=error.message||String(error);P.loading=false;P.ready=false;P.mode='svg';P.showSvg();
    $('loader').hidden=true;$('webglMode').disabled=true;$('svgMode').setAttribute('aria-pressed','true');$('webglMode').setAttribute('aria-pressed','false');
    $('backend').textContent='SVG · '+errorMessage;
  }
  async function restart() {
    const token=++generation;P.loading=true;P.ready=false;$('loader').hidden=false;$('loadDetail').textContent='Preparando a mesma batalha…';
    try {
      const stress=$('scenario').value==='stress';MS.Prototype.start('pikachu',stress?9:0,stress?'rain':null);
      if(renderer) { await renderer.prepare(MS.Prototype.snapshot(),Number($('detail').value),token); if(token===generation)renderer.draw(MS.Prototype.snapshot()); }
      if(token!==generation)return;
      P.loading=false;P.ready=!!renderer;P.frames=[];P.costs=[];P.lastStat=0;$('loader').hidden=true;
      setMode(renderer?P.mode:'svg');if(!renderer&&errorMessage)$('backend').textContent+=' · '+errorMessage;window.dispatchEvent(new Event('resize'));document.activeElement?.blur();
    }catch(error){fail(error);}
  }
  $('webglMode').onclick=()=>setMode('webgl');$('svgMode').onclick=()=>setMode('svg');$('restartLab').onclick=restart;
  $('scenario').onchange=restart;$('detail').onchange=restart;$('rate').onchange=()=>{P.fpsLimit=Number($('rate').value);P.costs=[];document.activeElement?.blur();};
  $('fullLab').onclick=()=>{const d=document.documentElement;if(!document.fullscreenElement)d.requestFullscreen?.();else document.exitFullscreen?.();};
  $('exportLab').onclick=()=>{const result={prototype:'webgl-1',base:'d8d902a148ee9e661384b707b7f1e16b11d0a1b1',userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,mode:P.mode,scenario:$('scenario').value,detail:Number($('detail').value),fpsLimit:P.fpsLimit,fpsLastSecond:P.frames.length,drawMsAverage:P.costs.length?P.costs.reduce((a,b)=>a+b,0)/P.costs.length:null,history:P.sessions,error:errorMessage,notes:'Tempos de desenho em JavaScript; não medem temperatura nem todo o trabalho da GPU.'};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pokemon-teste-webgl.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.activeElement?.blur();};
  (async()=>{try{
    manifest=await fetch('js/poses.json').then(r=>{if(!r.ok)throw new Error('Falha ao carregar as poses.');return r.json();});
    if(typeof PIXI==='undefined')throw new Error('PixiJS não carregou.');
    try{renderer=new Renderer();}catch(error){errorMessage='WebGL indisponível neste navegador; usando SVG.';$('webglMode').disabled=true;P.mode='svg';}
    if(/Silk|AFT[A-Z]|Fire ?TV/i.test(navigator.userAgent))$('detail').value='128';
    await restart();
  }catch(error){fail(error);}})();
})();
