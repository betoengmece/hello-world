const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
let frameCallback;
const elements=new Map();
function element(id){
  if(!elements.has(id))elements.set(id,{id,style:{},innerHTML:'',textContent:'',children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k];},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:800,height:500};},querySelectorAll(){return [];}});
  const el=elements.get(id);
  if(id==='clouds'&&!el.children.length)el.children=Array.from({length:5},(_,i)=>element('cloud-'+i));
  return el;
}
const math=Object.create(Math);let seed=7351;math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const storage=new Map();
const ctx={console,Math:math,window:{},navigator:{maxTouchPoints:0},document:{getElementById:element,querySelectorAll(){return [];},body:element('body')},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frameCallback=f;},setTimeout(){},clearTimeout(){}};
vm.createContext(ctx);
for(const name of ['data.js','art.js','art2.js','animated-kanto.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),ctx,{filename:name});
const MS=ctx.window.MS;
MS.Sfx=new Proxy({isOn:()=>false},{get:(obj,key)=>obj[key]||(()=>{})});
let engine=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
// Acesso restrito a este teste: o arquivo distribuído continua com sua API de debug atual.
engine=engine.replace('  applySettings();\n  initMenu();','  MS.testHooks={roundEnd,explode,captureChance,projSvg,renderAll,loadSave,saveGame};\n  applySettings();\n  initMenu();');
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
assert(MS.STAGES[10].guests.some(g=>g.sp==='snorlax'&&g.stayRounds===7));
for(const [sp,stage] of [['jigglypuff',0],['exeggutor',2],['snorlax',10]]){
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
assert.equal(MS.STAGES.length,11);
for(const st of MS.STAGES){assert(MS.THEMES[st.theme],st.name+' theme');for(const e of st.enemies.concat((st.guests||[]).map(g=>g.sp)))assert(MS.SPECIES[e],e+' exists');
  for(const w of (st.weather||[]))assert(['rain','sun','storm','snow'].includes(w.type));}
assert(!MS.STAGES[3].weather,'a Caverna não tem clima');
for(const [sp,S] of Object.entries(MS.SPECIES)){
  for(const k of (S.altKeys||[]))assert(MS.WEAPONS[k],sp+' alt '+k);
  for(const mv of ['b','a','c','b+a','b+c']){const m=MS.movesOf(sp,mv);assert(m.length>=1&&m.every(k=>MS.WEAPONS[k]),sp+' '+mv);}
  for(let i=0;i<20;i++)assert(MS.cleanMv(sp,MS.rollMoves(sp,.2)),sp+' roll');
}
assert.deepEqual(Array.from(MS.movesOf('pikachu','b+c')),['volt','volt~pikachu1']);
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
    debug.setMap({w,arch});debug.newCampaign('charmander');debug.beginStage(Math.floor(Math.random()*11));hooks.renderAll();
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
