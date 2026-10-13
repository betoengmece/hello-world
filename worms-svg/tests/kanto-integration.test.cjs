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
for(const name of ['data.js','art.js','animated-kanto.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),ctx,{filename:name});
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
for(let i=0;i<5;i++){
  debug.newCampaign('charmander');debug.beginStage(i);hooks.renderAll();
  const battle=debug.get();assert.equal(battle.stageIdx,i);assert(battle.units.every(u=>Number.isFinite(u.hp)&&u.hp>0));
  for(let n=0;n<60;n++)frameCallback();
}
assert.deepEqual(Array.from(MS.STAGES[1].enemies),['caterpie','beedrill','pidgey']);
assert.deepEqual(Array.from(MS.STAGES[3].enemies),['rattata','dugtrio','starmie']);
assert(MS.STAGES[0].guests.some(g=>g.sp==='jigglypuff'));
assert(MS.STAGES[2].guests.some(g=>g.sp==='exeggutor'));
assert(MS.STAGES[4].guests.some(g=>g.sp==='snorlax'&&g.stayRounds===7));
for(const [sp,stage] of [['jigglypuff',0],['exeggutor',2],['snorlax',4]]){
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
console.log('OK: Veneno, 5 fases, visitantes, captura, 5 ataques, renderização e saves.');
