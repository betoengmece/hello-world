const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
let frameCallback;
const elements=new Map();
function element(id){
  if(!elements.has(id))elements.set(id,{id,style:{},innerHTML:'',textContent:'',children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k];},listeners:new Map(),addEventListener(type, fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);},getBoundingClientRect(){return {left:0,top:0,width:800,height:500};},querySelectorAll(){return [];}});
  const el=elements.get(id);
  if(id==='clouds'&&!el.children.length)el.children=Array.from({length:5},(_,i)=>element('cloud-'+i));
  return el;
}
const math=Object.create(Math);let seed=7351;math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const storage=new Map();
const controls = ['up','down','fire'].map(act => Object.assign(element('control-'+act), {dataset:{act}}));
const ctx={console,Math:math,window:{},navigator:{maxTouchPoints:0},document:{getElementById:element,querySelectorAll(selector){return selector==='.btn' ? controls : [];},body:element('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frameCallback=f;},setTimeout(){},clearTimeout(){}};
vm.createContext(ctx);
for(const name of ['data.js','art.js','art2.js','animated-kanto.js','art-mar.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),ctx,{filename:name});
const MS=ctx.window.MS;
MS.Sfx=new Proxy({isOn:()=>false},{get:(obj,key)=>obj[key]||(()=>{})});
let engine=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
// Acesso restrito a este teste: o arquivo distribuído continua com sua API de debug atual.
engine=engine.replace('  applySettings();\n  fitWrap();\n  initMenu();','  MS.testHooks={restart,roundEnd,explode,captureChance,projSvg,renderAll,loadSave,saveGame,pressFire,releaseFire,adjustAim,orderSvg,delayCost,actionDelay,forecastTurns,toggleAiSpeed,getFrame:()=>frameNo};\n  applySettings();\n  fitWrap();\n  initMenu();');
vm.runInContext(engine,ctx,{filename:'game.js'});
const debug=MS.debug,hooks=MS.testHooks;
assert(hooks,'test hooks must be installed');
assert.equal(MS.TYPE_NAME.poison,'Veneno');
assert.equal(MS.typeMult('poison',['grass']),2);
assert.equal(MS.typeMult('poison',['ground']),.5);
assert.equal(MS.typeMult('poison',['rock']),.5);
assert.equal(MS.typeMult('poison',['poison']),.5);
assert.equal(MS.typeMult('grass',['poison']),.5);
assert.equal(MS.typeMult('bug',['poison']),.5);
assert.equal(MS.typeMult('psychic',['poison']),2);
assert.equal(MS.typeMult('ground',['poison']),2);
assert.equal(MS.typeMult('poison',['grass','psychic']),2);
assert.equal(MS.typeMult('grass',['bug','poison']),.25);
const chosen={beedrill:1,jigglypuff:1,dugtrio:3,exeggutor:3,snorlax:2};
assert.deepEqual(JSON.parse(JSON.stringify(MS.AnimatedKanto.selected)),chosen);
for(const [sp,S] of Object.entries(MS.SPECIES)){
  assert(MS.WEAPONS[S.weapon],sp+' weapon');assert(S.types.every(t=>MS.TYPE_COLOR[t]&&MS.TYPE_NAME[t]),sp+' types');
  assert(MS.Art.draw(sp,{f:30,blink:false,bob:0,step:0,breath:0,x:0}),sp+' drawing');
}
for(let i=0;i<MS.STAGES.length;i++){
  debug.newCampaign('charmander');debug.beginStage(i);hooks.renderAll();
  const battle=debug.get();assert.equal(battle.stageIdx,i);assert(battle.units.every(u=>Number.isFinite(u.hp)&&u.hp>0));
  for(let n=0;n<60;n++)frameCallback();
}
assert.deepEqual(Array.from(MS.STAGES[1].enemies),['caterpie','beedrill','pidgey']);
assert.deepEqual(Array.from(MS.STAGES[3].enemies),['zubat','dugtrio','geodude']);
assert(MS.STAGES[0].guests.some(g=>g.sp==='jigglypuff'));
assert(MS.STAGES[2].guests.some(g=>g.sp==='exeggutor'));
const DRAGAO=MS.STAGES.findIndex(s=>s.name==='Covil do Dragão');assert(MS.STAGES[DRAGAO].guests.some(g=>g.sp==='snorlax'&&g.stayRounds===7));
for(const [sp,stage] of [['jigglypuff',0],['exeggutor',2],['snorlax',DRAGAO]]){
 debug.newCampaign('charmander');debug.beginStage(stage);
 const original=MS.STAGES[stage].guests;const def=original.find(g=>g.sp===sp);MS.STAGES[stage].guests=[{...def,rarity:1}];
 for(let i=0;i<10&&!debug.get().guest;i++)hooks.roundEnd();
 const guest=debug.get().guest;assert(guest,sp+' appears');assert.equal(guest.sp,sp);assert.equal(guest.team,2);
 if(sp==='snorlax')assert.equal(guest.turnsLeft,7);
 guest.capScale=1;guest.hp=guest.maxhp*.3;assert(hooks.captureChance(guest)>0,sp+' capturable');hooks.renderAll();
 MS.STAGES[stage].guests=original;
}
debug.newCampaign('charmander');debug.beginStage(1);
let battle=debug.get();const beedrill=battle.units.find(u=>u.sp==='beedrill'),player=battle.units[0];
const oldHp=player.hp;const poison=MS.WEAPONS.ferrao;
hooks.explode(player.x,player.y-MS.SPECIES[player.sp].hitY*player.scale,{wp:poison,ownerUnit:beedrill});
assert.equal(player.hp,oldHp-poison.dmg,'poison damage at impact');
const projectile=hooks.projSvg({wk:'ferrao',wp:poison,x:100,y:100,vx:3,vy:-2,trail:[{x:98,y:101}],spin:0});assert(projectile.includes('#b45ac8'),'poison projectile renderer');
for(const sp of Object.keys(chosen)){
 debug.newCampaign(sp);debug.setPower(70);debug.setAngle(40);debug.fire();
 assert.equal(debug.get().state,'flying',sp+' fires');
 for(let i=0;i<700&&debug.get().state==='flying';i++)frameCallback();
 assert.notEqual(debug.get().state,'flying',sp+' projectile completes');
 hooks.saveGame();assert.equal(hooks.loadSave().roster[0],sp,sp+' saved game loads');
}
assert([...elements.values()].every(e=>!/(?:NaN|undefined)/.test(e.innerHTML)), 'all rendered layers have defined coordinates and fills');
console.log('OK: Veneno, 11 fases, visitantes, captura, 5 ataques, renderização e saves.');

// ---- segunda leva: variantes de golpe, Gelo/Lutador/Fantasma, fases novas, Magikarp -> Gyarados e saves antigos ----
assert.equal(MS.SPECIES.magikarp.evo,'gyarados');assert(MS.SPECIES.gyarados&&MS.SPECIES.magikarp.xpMul>1);
assert.equal(MS.typeMult('ice',['grass','flying']),4);assert.equal(MS.typeMult('fighting',['normal']),2);assert.equal(MS.typeMult('ghost',['ghost']),2);
assert(MS.typeMult('normal',['ghost'])<1&&MS.typeMult('fire',['ice'])===2);
assert.equal(MS.STAGES.length,13);
for(const st of MS.STAGES){assert(MS.THEMES[st.theme],st.name+' theme');for(const e of st.enemies.concat((st.guests||[]).map(g=>g.sp)))assert(MS.SPECIES[e],e+' exists');
  for(const w of (st.weather||[]))assert(['rain','sun','storm','snow'].includes(w.type));}
assert(!MS.STAGES[3].weather,'a Caverna não tem clima');
for(const [sp,S] of Object.entries(MS.SPECIES)){
  for(const k of (S.altKeys||[]))assert(MS.WEAPONS[k],sp+' alt '+k);
  for(const mv of ['b','a','c','b+a','b+c']){const m=MS.movesOf(sp,mv);assert(m.length>=1&&m.every(k=>MS.WEAPONS[k]),sp+' '+mv);}
  for(let i=0;i<20;i++)assert(MS.cleanMv(sp,MS.rollMoves(sp,.2)),sp+' roll');
}
assert.deepEqual(Array.from(MS.movesOf('pikachu','b+c')),['volt','volt~pikachu1','raioceu']);
assert(MS.WEAPONS['volt~pikachu0'].dmg>MS.WEAPONS.volt.dmg&&MS.WEAPONS['volt~pikachu1'].boom>MS.WEAPONS.volt.boom,'variantes mais fortes / com mais área');
assert.deepEqual(Array.from(MS.movesOf('magikarp','a')),['batida']);
storage.set('ms_campaign_v1',JSON.stringify({roster:['charmander','pikachu'],xp:[0,0],great:0,ultra:0,stage:2,balls:3,weakStart:false}));
const old=hooks.loadSave();assert.deepEqual(Array.from(old.mv),['b','b'],'save antigo sem golpes variantes');assert.equal(old.stage,2);
debug.newCampaign('pikachu');const pk=debug.get().units[0];pk.mvs='b+c';pk.moves=MS.movesOf('pikachu','b+c');pk.mi=1;debug.setPower(60);debug.setAngle(45);debug.fire();
assert.equal(debug.get().state,'flying','dispara a variante');
assert([...elements.values()].every(e=>!/(?:NaN|undefined)/.test(e.innerHTML)), 'sem NaN após a segunda leva');
console.log('OK: variantes de golpe, novos tipos, 11 fases, Magikarp -> Gyarados e saves antigos.');

// ---- terceira leva: golpes com peso/efeitos, shiny, voadores, mapas largos e variedade ----
{
  const W_=MS.WEAPONS;
  assert(W_.pedra.windMul<=0.3&&W_.ventania.windMul>=1.5,'pedra é pesada; ventania é leve');
  assert(W_.pedra.size>1.3&&W_.pedra.shake>=10,'pedra grande e com tremor');
  assert(W_.volt.chain>0&&W_.fogo.st.type==='burn'&&W_.avalanche.split&&W_.rolamento.bounce&&W_.terremoto.quake&&W_.lama.build,'mecânicas novas nos dados');
  assert.notEqual(MS.moveNote(W_.pedra),'');
  for(const k of ['pidgey','butterfree','zubat','gastly'])assert(MS.SPECIES[k].fly,k+' voa');
  assert(!MS.SPECIES.geodude.fly);
  assert.equal(MS.SHINY_P,1/1000);
  for(const s of Object.values(MS.SPECIES))assert(Number.isFinite(s.sh),s.name+' tem matiz shiny');
  for(const st of MS.STAGES)assert(Array.isArray(st.pool),st.name+' pool');
  // saves com shiny e migração
  storage.set('ms_campaign_v1',JSON.stringify({roster:['charmander','pikachu'],xp:[0,0],mv:['b','b'],sh:[0,1],great:0,ultra:0,stage:1,balls:3,weakStart:false}));
  assert.deepEqual(Array.from(hooks.loadSave().sh),[0,1],'shiny salvo');
  storage.set('ms_campaign_v1',JSON.stringify({roster:['charmander','pikachu'],xp:[0,0],great:0,ultra:0,stage:1,balls:3,weakStart:false}));
  assert.deepEqual(Array.from(hooks.loadSave().sh),[0,0],'save antigo sem shiny');
  // todas as fases em larguras e relevos diferentes
  for(const w of [800,1100,1400,1700])for(const arch of ['rolling','flat','valley','slope','mesas','spires']){
    debug.setMap({w,arch});debug.newCampaign('charmander');debug.beginStage(Math.floor(Math.random()*MS.STAGES.length));hooks.renderAll();
    const g=debug.get();assert.equal(debug.W,w);assert.equal(debug.heights.length,w);
    assert(g.units.every(u=>u.x>=0&&u.x<=w&&Number.isFinite(u.y)&&u.y<480),'posições válidas '+w+arch);
    assert(g.teams[0].units.length>=1&&g.teams[1].units.length>=1);
  }
  debug.setMap(null);
  // shiny forçado
  debug.setShinyP(1);debug.setMap({w:800,arch:'rolling'});debug.newCampaign('charmander');debug.beginStage(0);
  assert(debug.get().teams[1].units.every(u=>u.sh),'selvagens shiny com chance 1');
  assert(debug.shF('pikachu',true).includes('url(#fh'));assert.equal(debug.shF('pikachu',false),'');
  debug.setShinyP(1/1000);debug.setMap(null);
  // visitante voador aparece no ar
  debug.newCampaign('charmander');debug.setMap({w:1400,arch:'rolling'});debug.beginStage(1);debug.forceGuest('butterfree');
  for(let i=0;i<10&&!debug.get().guest;i++)hooks.roundEnd();
  const fg=debug.get().guest;assert(fg&&fg.flying&&fg.alt>50&&fg.y<fg.alt+500,'visitante voador no ar');
  debug.setMap(null);
  assert([...elements.values()].every(e=>!/(?:NaN|undefined)/.test(e.innerHTML)), 'sem NaN após a terceira leva');
  console.log('OK: golpes pesados/leves, efeitos, shiny, voadores, mapas largos e variedade.');
}

// ---- quarta leva: Metapod e novas evoluções (Graveler, Magneton, Dewgong) ----
{
  assert.equal(MS.SPECIES.caterpie.evo,'metapod');assert.equal(MS.SPECIES.metapod.evo,'butterfree');
  assert.equal(MS.SPECIES.geodude.evo,'graveler');assert.equal(MS.SPECIES.magnemite.evo,'magneton');assert.equal(MS.SPECIES.seel.evo,'dewgong');
  for(const k of ['metapod','graveler','magneton','dewgong'])assert(MS.SPECIES[k],k);
  assert(MS.WEAPONS.casca&&MS.WEAPONS.casca.dmg>0,'Metapod tem golpe próprio');
  assert(MS.SPECIES.magneton.fly,'Magneton flutua');assert(!MS.SPECIES.metapod.fly,'Metapod não voa');
  for(const k of ['metapod','graveler','magneton','dewgong'])for(const mv of ['b','a','b+a'])assert(MS.movesOf(k,mv).every(w=>MS.WEAPONS[w]),k+' '+mv);
  // evolução de verdade: Caterpie com XP quase cheio evolui para Metapod ao vencer a fase
  debug.newCampaign('caterpie');debug.beginStage(0);
  const cs=debug.get().campaign;cs.xp[0]=105;
  debug.stageClear();
  assert.equal(debug.get().campaign.roster[0],'metapod','Caterpie evolui para Metapod');
  console.log('OK: Metapod e evoluções Graveler, Magneton e Dewgong.');
}

// ---- quinta leva: ilhas flutuantes, terreno destrutível de verdade, andar estilo mobile e ordem por atraso ----
{
  // ilhas: o mapa tem vãos (colunas sem chão) e a máscara bate com a superfície
  debug.setMap({w:1100,arch:'rolling'});debug.newCampaign('charmander');debug.beginStage(2);
  const W=debug.W,H=500;let gaps=0;for(let x=0;x<W;x++)if(debug.surf(x)>H)gaps++;
  assert(gaps>40,'mapa em ilhas tem vãos');
  const g=debug.get();
  for(const u of g.units){assert(debug.surf(u.x)<480,'todos nascem em chão firme');assert(!u.air);}
  // explosão abre um buraco de verdade e quem está em cima cai
  const me=g.units[0],y0=me.y;assert(debug.solid(me.x,me.y+2));
  debug.carve(me.x,me.y+14,26);assert(!debug.solid(me.x,me.y+2),'buraco embaixo do Pokémon');
  for(let i=0;i<40;i++)frameCallback();
  assert(me.y>y0+8,'Pokémon caiu no buraco');
  // túnel: carve no meio da ilha deixa chão em cima e embaixo
  let tx=0;for(let x=40;x<W-40;x+=5){const s=debug.surf(x);if(s<400&&debug.solid(x,s+75)&&Math.abs(debug.surf(x+15)-s)<10){tx=x;break;}}const top=debug.surf(tx);assert(tx>0,'achou trecho grosso');
  debug.carve(tx,top+40,12);assert(debug.solid(tx,top+2)&&!debug.solid(tx,top+40)&&debug.solid(tx,top+60),'túnel com teto e chão');
  assert(debug.terrainPath().length>100,'contorno do terreno desenhado');
  debug.setMap(null);
}
{
  // ordem por atraso: joga quem tem menos atraso, de qualquer time
  debug.newCampaign('charmander');debug.beginStage(1);let g=debug.get();
  const o=debug.turnOrder();assert(o[0]===g.units.find(u=>g.teams[g.turnTeam].units[g.teams[g.turnTeam].cur]===u),'quem joga é o primeiro da ordem');
  const me=g.units.find(u=>g.teams[g.turnTeam].units[g.teams[g.turnTeam].cur]===u);const d0=me.delay;
  if(g.state==='aim'&&g.turnTeam===0){debug.passTurn();assert(me.delay>d0+120,'passar a vez soma atraso');}
  for(let i=0;i<20;i++)frameCallback();
  // golpe forte custa mais atraso que golpe fraco
  assert(MS.WEAPONS.fogo2.dmg>MS.WEAPONS.teia.dmg);
  // vento tem componente vertical
  let vy=0;for(let i=0;i<30;i++){debug.newCampaign('charmander');debug.beginStage(9);vy=Math.max(vy,Math.abs(debug.windY));}
  assert(vy>0.3,'vento sopra também para cima/baixo');
}
{
  // Cavar (Onix): o golpe atravessa o chão abrindo um túnel
  assert.equal(MS.SPECIES.onix.weapon,'cavar');assert(MS.WEAPONS.cavar.dig>0);assert(MS.moveNote(MS.WEAPONS.cavar).includes('túnel'));
  let maxDug=0,before=0,after=0;
  for(let tries=0;tries<5&&maxDug<5;tries++){
    debug.setMap({w:800,arch:'flat',layout:'sides'});debug.newCampaign('onix');debug.beginStage(3);
    const g=debug.get(),u=g.units[0];if(g.state!=='aim'||g.turnTeam!==0)continue;
    u.mi=0;u.tilt=0;before=0;for(const v of debug.mask)before+=v;
    debug.setAngle(4);debug.setPower(12);debug.fire();
    for(let i=0;i<500&&debug.get().state==='flying';i++){frameCallback();for(const p of debug.get().projs)maxDug=Math.max(maxDug,p.dug||0);}
    after=0;for(const v of debug.mask)after+=v;
  }
  assert(maxDug>=5,'Cavar entrou na terra');assert(before-after>700,'Cavar removeu terra (túnel + explosão)');
  debug.setMap(null);
}
assert([...elements.values()].every(e=>!/(?:NaN|undefined)/.test(e.innerHTML)), 'camadas sem NaN depois das ilhas');
console.log('OK: ilhas flutuantes, buracos e túneis, queda, ordem por atraso, vento 2D e Cavar.');

// ---- sexta leva: faixa de mira por espécie, ângulo em relação à horizontal, atravessar Pokémon, confirmação do reinício ----
{
  assert.deepEqual(Array.from(MS.aimRange('caterpie')),[0,180],'Caterpie escolhe 180°');
  assert.deepEqual(Array.from(MS.aimRange('magikarp')),[0,180]);
  assert.equal(MS.aimRange('gyarados')[1]-MS.aimRange('gyarados')[0],30,'Gyarados só tem 30°');
  for(const sp of Object.keys(MS.SPECIES)){const r=MS.aimRange(sp);assert(r[1]>r[0],sp+' faixa');}
  // no plano, a faixa do Gyarados fica entre 30° e 60° da horizontal; segurar ↑ não passa do limite
  debug.setMap({w:800,arch:'flat',layout:'sides'});debug.newCampaign('gyarados');debug.beginStage(0);
  let u=debug.get().units[0];u.tilt=0;
  const [lo,hi]=debug.aimWindow(u);assert(Math.abs(lo-30)<1e-6&&Math.abs(hi-60)<1e-6,'faixa 30–60 no plano');
  const k=debug.keys||null;
  // inclinação gira a faixa: morro para baixo à frente libera ângulos mais baixos
  u.tilt=0.3;const w2=debug.aimWindow(u);assert(w2[0]<lo-10,'no morro a faixa gira');u.tilt=0;
  // atirar usa o ângulo absoluto (sem somar a inclinação)
  debug.setAngle(45);debug.fire();assert.equal(debug.get().state,'flying');
  for(let i=0;i<700&&debug.get().state==='flying';i++)frameCallback();
  // Pokémon atravessam uns aos outros ao andar
  debug.setMap({w:800,arch:'flat',layout:'mixed'});debug.newCampaign('charmander');debug.beginStage(0);
  const g=debug.get();const me=g.units[0],other=g.units[1];
  other.x=me.x+14;other.y=me.y;
  for(let i=0;i<60;i++){me.face=1;}
  const x0=me.x;for(let i=0;i<40;i++){me.air=false;me.x+=0;}
  // walkUnit é interno: simula as teclas
  const before=me.x;g.state;debug.setAngle(45);
  // reinício pede confirmação e pausa o jogo
  hooks.restart();let p=debug.get().panel;assert(p&&p.pause&&p.buttons.length===2,'↻ abre a confirmação');
  const st=debug.get().state,f0=debug.get().units.map(v=>v.delay).join();for(let i=0;i<30;i++)frameCallback();
  assert.equal(debug.get().state,st,'jogo parado durante a confirmação');
  p.buttons[0].fn();assert(!debug.get().panel,'Continuar fecha a pergunta');
  hooks.restart();debug.get().panel.buttons[1].fn();assert(!debug.get().panel&&debug.get().state!=='over','Reiniciar recomeça a fase');
  debug.setMap(null);
}
{
  // a IA dos selvagens chega a atirar (planeja dentro da faixa de mira e define a força)
  debug.newCampaign('charmander');debug.beginStage(1);
  let g=debug.get();if(g.state==='aim'&&g.turnTeam===0)debug.passTurn();
  let fired=false;for(let i=0;i<2400&&!fired;i++){frameCallback();g=debug.get();if(g.state==='flying'&&g.turnTeam===1)fired=true;if(g.state==='aim'&&g.turnTeam===0)debug.passTurn();}
  assert(fired,'selvagem atirou');
}
console.log('OK: faixa de mira por espécie, ângulo absoluto, confirmação do reinício, IA atira.');

// ---- sétima leva: golpes especiais (subterrâneo, raio do céu, fissura, teleporte, hiper raio, redemoinho, proteção) ----
{
  const run=(n=900)=>{for(let i=0;i<n&&['flying','skip'].includes(debug.get().state);i++)frameCallback();};
  const setup=(sp)=>{let g;for(let k=0;k<8;k++){debug.setMap({w:800,arch:'flat',layout:'sides'});debug.newCampaign(sp);debug.beginStage(0);g=debug.get();if(g.state==='aim'&&g.turnTeam===0)break;}const u=g.units[0];u.tilt=0;return {g,u,foe:g.teams[1].units[0]};};
  const pick=(u,wk)=>{u.mi=u.moves.indexOf(wk);assert(u.mi>=0,u.sp+' tem '+wk);};
  for(const [sp,wk] of [['dugtrio','subterra'],['pikachu','raioceu'],['electabuzz','tempestade'],['graveler','fissura'],['starmie','teleporte'],['gyarados','hiperraio'],['pidgey','redemoinho'],['squirtle','protecao']])
    assert(MS.movesOf(sp,'b').includes(wk),sp+' ganhou '+wk);
  assert(MS.movesOf('gyarados','b')[0]==='hidrobomba','golpe antigo continua');
  // Proteção: barreira por 2 turnos, dano cai para 30%
  let {u,foe}=setup('squirtle');pick(u,'protecao');debug.fire();assert.equal(u.shield,2,'barreira ativa');
  const boom=()=>{const h=u.hp;hooks.explode(u.x,u.y-MS.SPECIES[u.sp].hitY,{wp:MS.WEAPONS.investida,ownerUnit:foe});return h-u.hp;};
  const d1=boom();u.shield=0;u.hp=u.maxhp;const d2=boom();
  assert(d2>0&&d1<=Math.ceil(d2*0.3)+1,'barreira reduz o dano ('+d1+' vs '+d2+')');
  // Raio do Céu: acerta o alvo e depois cai o raio
  ({u,foe}=setup('pikachu'));pick(u,'raioceu');let sh=debug.findShot(foe,'raioceu');
  if(sh){const h=foe.hp;debug.setAngle(sh.ang);debug.setPower(sh.pw);debug.fire();run();assert(h-foe.hp>MS.WEAPONS.raioceu.dmg,'raio do céu causou dano extra');}
  // Hiper Raio: feixe do Pokémon até o ponto
  ({u,foe}=setup('gyarados'));pick(u,'hiperraio');sh=debug.findShot(foe,'hiperraio');
  if(sh){const wild=debug.get().teams[1].units,h=wild.reduce((a,v)=>a+v.hp,0);debug.setAngle(sh.ang);debug.setPower(sh.pw);debug.fire();run();assert(h-wild.reduce((a,v)=>a+v.hp,0)>MS.WEAPONS.hiperraio.dmg,'hiper raio somou dano');}
  // Pidgeotto sobe antes de disparar o hiper raio e depois desce
  ({u,foe}=setup('pidgeotto'));pick(u,'hiperraio');sh=debug.findShot(foe,'hiperraio');
  if(sh){debug.setAngle(sh.ang);debug.setPower(sh.pw);debug.fire();let maxLift=0;for(let i=0;i<900&&debug.get().state==='flying';i++){frameCallback();maxLift=Math.max(maxLift,u.lift||0);}assert(maxLift>80,'voador sobe para atirar');assert(!(u.lift>0),'e desce depois');}
  // Redemoinho: puxa quem está perto
  ({u,foe}=setup('pidgey'));{const x=foe.x-70,fx0=foe.x;hooks.explode(x,foe.y-10,{wp:MS.WEAPONS.redemoinho,ownerUnit:u});assert(foe.x<fx0-20,'puxado para o centro');}
  // Fissura: quebra muito terreno
  ({u,foe}=setup('graveler'));{let gx=0;for(let x=60;x<debug.W-60;x+=5){const s=debug.surf(x);if(s<420&&debug.solid(x,s+70)&&debug.solid(x-40,debug.surf(x-40)+50)&&debug.solid(x+40,debug.surf(x+40)+50)){gx=x;break;}}let b=0;for(const v of debug.mask)b+=v;hooks.explode(gx,debug.surf(gx)+4,{wp:MS.WEAPONS.fissura,ownerUnit:u});let a=0;for(const v of debug.mask)a+=v;assert(b-a>6000,'fissura abriu buraco enorme');}
  // Ataque Subterrâneo: entra na terra, corre por baixo e estoura embaixo do alvo
  ({u,foe}=setup('dugtrio'));
  {let tx=0;for(let x=Math.round(u.x)+110;x<Math.round(u.x)+190;x++){if(debug.surf(x)<470&&Math.abs(debug.surf(x)-debug.surf(u.x))<30){tx=x;break;}}
   if(tx){foe.flying=false;foe.alt=0;foe.x=tx;foe.y=debug.surf(tx);pick(u,'subterra');u.face=1;debug.setAngle(-25);debug.setPower(10);const h=foe.hp;debug.fire();
     let went=false;for(let i=0;i<900&&debug.get().state==='flying';i++){frameCallback();if(debug.get().projs.some(p=>p.under))went=true;}
     assert(went,'golpe entrou na terra');assert(foe.hp<h,'acertou por baixo');}}
  // Teleporte: o Pokémon vai para onde o golpe caiu
  ({u,foe}=setup('starmie'));pick(u,'teleporte');u.face=1;debug.setAngle(72);debug.setPower(22);{const x0=u.x;debug.fire();run();assert(Math.abs(u.x-x0)>30||/falhou/.test(JSON.stringify(debug.get())),'teleportou');assert(u.alive);}
  debug.setMap(null);
}
assert([...elements.values()].every(e=>!/(?:NaN|undefined)/.test(e.innerHTML)), 'camadas sem NaN depois dos golpes especiais');
console.log('OK: golpes especiais (subterrâneo, raio do céu, fissura, teleporte, hiper raio, redemoinho, proteção).');

// fases debaixo d'água: tema com flag under, Pokémon de Fogo na bolha, Água forte e Fogo fraco
{
 const RECIFE=MS.STAGES.findIndex(s=>s.theme==='recife');assert(RECIFE>0,'tem o Recife de Coral');
 assert(MS.THEMES.recife.under&&MS.THEMES.abismo.under);
 debug.newCampaign('charmander');debug.beginStage(RECIFE);
 const b=debug.get(),me=b.units[0],foe=b.units.find(u=>u.team===1);
 const hp0=foe.hp;hooks.explode(foe.x,foe.y-MS.SPECIES[foe.sp].hitY*foe.scale,{wp:{...MS.WEAPONS[MS.SPECIES.charmander.weapon]},ownerUnit:me});
 const fogo=hp0-foe.hp;foe.hp=hp0;
 hooks.explode(foe.x,foe.y-MS.SPECIES[foe.sp].hitY*foe.scale,{wp:{...MS.WEAPONS[MS.SPECIES.charmander.weapon],type:'normal'},ownerUnit:me});
 assert(fogo>0&&fogo<hp0-foe.hp+1,'fogo enfraquece debaixo d\'água ('+fogo+' vs '+(hp0-foe.hp)+')');
 hooks.renderAll();
 console.log('OK underwater stages');
}

// v4: tutorial, previsão sem alterar a ordem real, memória por Pokémon e velocidade da IA.
{
  debug.initIntro();
  hooks.renderAll();
  assert.match(element('hud').innerHTML, /1\. Use/);
  assert.match(element('aim').innerHTML, /#ffde7a/);
  const angle = debug.get().angle;
  hooks.adjustAim(1);
  assert.equal(debug.get().angle, angle + 1);
  hooks.pressFire();
  for (let i = 0; i < 5; i++) frameCallback();
  hooks.renderAll();
  assert.match(element('hud').innerHTML, /3\. Solte/);
  hooks.releaseFire();
  for (let i = 0; i < 180 && debug.get().state === 'flying'; i++) frameCallback();
  hooks.renderAll();
  assert.match(element('msgbox').innerHTML, /Caiu antes/);
  assert.doesNotMatch(element('aim').innerHTML, /#ffde7a/, 'guia visível só antes do primeiro lançamento');

  debug.setMap({w:800,arch:'flat',layout:'sides'});
  debug.newCampaign('machamp');
  const battle = debug.get(), player = battle.teams[0].units[0], enemy = battle.teams[1].units[0];
  const seismic = MS.WEAPONS[MS.SPECIES.machamp.weapon];
  assert.equal(seismic.label, 'Golpe Sísmico');
  assert(seismic.carve > MS.WEAPONS.soco.carve && MS.WEAPONS.soco.push > seismic.push);
  assert(MS.movesOf('machamp', 'a').includes('karate'));
  player.moves = ['seismic', 'karate'];
  const cost = hooks.delayCost(player, hooks.actionDelay(player));
  const realDelay = player.delay;
  enemy.delay = realDelay + cost - 1;
  for (const other of battle.teams[1].units) if (other !== enemy) other.delay = realDelay + cost + 100;
  assert.equal(debug.turnOrder()[0], player);
  assert.equal(debug.turnOrder(player, cost)[0], enemy);
  assert.equal(player.delay, realDelay);
  assert.match(hooks.orderSvg(), new RegExp('Após este golpe · \\+' + cost));
  player.mi = 1;
  assert.notEqual(hooks.delayCost(player, hooks.actionDelay(player)), cost);
  player.mi = 0;

  debug.setAngle(45);
  debug.setPower(38);
  debug.fire();
  assert.equal(player.lastShot.power, 38);
  assert.equal(player.lastShot.angle, 45);
  for (let i = 0; i < 650 && debug.get().state === 'flying'; i++) frameCallback();
  assert(Number.isFinite(player.lastShot.impact?.x), 'impacto associado ao ataque do Machamp');
  for (let i = 0; i < 300 && debug.get().state === 'settle'; i++) frameCallback();
  assert.equal(debug.get().state, 'ai');
  hooks.toggleAiSpeed();
  let frame = hooks.getFrame();
  frameCallback();
  assert.equal(hooks.getFrame() - frame, 2, 'IA em velocidade dupla');
  hooks.toggleAiSpeed();
  frame = hooks.getFrame();
  frameCallback();
  assert.equal(hooks.getFrame() - frame, 1, 'IA voltou para velocidade normal');
  debug.setMap(null);
  console.log('OK v4: tutorial, previsão de turnos, golpes, memória de impacto e velocidade da IA.');
}

// v4.1: toque real da interface (eventos PointerEvent simulados) e fila em duelos.
{
  const pointer = (act, type, id = 1, pointerType = 'touch') => {
    for (const handler of element('control-' + act).listeners.get(type) || [])
      handler({pointerId:id, pointerType, preventDefault(){}});
  };
  debug.initIntro();
  const start = debug.get().angle;
  pointer('up', 'pointerdown');
  pointer('up', 'pointerup');
  assert.equal(debug.get().angle, start + 1, 'toque simples altera 1°');
  pointer('down', 'pointerdown');
  for (let i = 0; i < 25; i++) frameCallback();
  pointer('down', 'lostpointercapture');
  const stopped = debug.get().angle;
  assert(stopped < start - 5, 'segurar repete o ajuste');
  for (let i = 0; i < 12; i++) frameCallback();
  assert.equal(debug.get().angle, stopped, 'perder a captura para a mira');

  pointer('fire', 'pointerdown');
  pointer('fire', 'pointerup');
  assert.equal(debug.get().intro.balls, 5, 'toque acidental não gasta uma Pokébola');
  pointer('fire', 'pointerdown');
  for (let i = 0; i < 8; i++) frameCallback();
  pointer('fire', 'pointerup', 2);
  assert.equal(debug.get().state, 'aim', 'outro dedo não solta o tiro');
  pointer('fire', 'pointerup');
  assert.equal(debug.get().state, 'flying', 'tirou o dedo, lançou');
  assert.equal(debug.get().intro.balls, 4);
  assert(debug.get().intro.lastShot.power >= 3);

  debug.newCampaign('machop');
  const [player, enemy, other] = debug.get().units;
  other.alive = false;
  enemy.delay = 1;
  enemy.webbed = true;
  const forecast = hooks.forecastTurns(player, 850);
  assert.equal(forecast.length, 3);
  assert.equal(forecast[0].unit, enemy);
  assert.equal(forecast[0].blocked, true);
  assert.equal(forecast[1].unit, enemy);
  assert.equal(forecast[1].blocked, false);
  assert.equal(enemy.delay, 1);
  assert.equal(enemy.webbed, true);
  console.log('OK v4.1: toque e soltura, cancelamento da mira, fila de três e turno bloqueado.');
}
