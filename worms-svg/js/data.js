// Dados do jogo: tipos, ataques, espécies, cenários e fases da campanha
(() => {
  const MS = window.MS = window.MS || {};

  // ---------- Tipos ----------
  MS.TYPE_COLOR = {
    normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030',
    bug: '#a8b820', flying: '#a890f0', psychic: '#f85888', dragon: '#7038f8', rock: '#b8a038', ground: '#e0c068', poison: '#a040a0',
    ice: '#98d8d8', fighting: '#c03028', ghost: '#705898'
  };
  MS.TYPE_NAME = {
    normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico',
    bug: 'Inseto', flying: 'Voador', psychic: 'Psíquico', dragon: 'Dragão', rock: 'Pedra', ground: 'Terra', poison: 'Veneno',
    ice: 'Gelo', fighting: 'Lutador', ghost: 'Fantasma'
  };

  // Efetividade: tipo do ataque -> tipo do defensor. 2 = super efetivo, 0.5 = pouco efetivo.
  const CHART = {
    fire:     { grass: 2, bug: 2, ice: 2, water: .5, fire: .5, dragon: .5, rock: .5 },
    water:    { fire: 2, ground: 2, rock: 2, water: .5, grass: .5, dragon: .5 },
    grass:    { water: 2, ground: 2, rock: 2, fire: .5, grass: .5, bug: .5, flying: .5, dragon: .5, poison: .5 },
    electric: { water: 2, flying: 2, grass: .5, electric: .5, dragon: .5, ground: .5 },
    bug:      { grass: 2, psychic: 2, fire: .5, flying: .5, poison: .5, fighting: .5, ghost: .5 },
    flying:   { grass: 2, bug: 2, fighting: 2, electric: .5, rock: .5 },
    psychic:  { psychic: .5, poison: 2, fighting: 2 },
    dragon:   { dragon: 2 },
    rock:     { fire: 2, flying: 2, bug: 2, ice: 2, ground: .5, fighting: .5 },
    ground:   { fire: 2, electric: 2, rock: 2, poison: 2, grass: .5, bug: .5, flying: .5 },
    normal:   { rock: .5, ghost: .3 },
    poison:   { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5 },
    ice:      { grass: 2, ground: 2, flying: 2, dragon: 2, fire: .5, water: .5, ice: .5 },
    fighting: { normal: 2, rock: 2, ice: 2, psychic: .5, flying: .5, bug: .5, poison: .5, ghost: .3 },
    ghost:    { ghost: 2, psychic: 2, normal: .3 }
  };
  MS.typeMult = (atk, defTypes) =>
    defTypes.reduce((m, t) => m * ((CHART[atk] && CHART[atk][t] !== undefined) ? CHART[atk][t] : 1), 1);

  // ---------- Ataques ----------
  // speed/grav são multiplicadores; push empurra quem for atingido; web prende na teia.
  MS.WEAPONS = {
    fogo:      { label: 'Lança-chamas',    type: 'fire',     style: 'fire',    count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 46, carve: 28, dmg: 60 },
    planta:    { label: 'Folha Navalha',   type: 'grass',    style: 'leaf',    count: 3, spread: 6, speed: 0.95, grav: 0.5, boom: 24, carve: 10, dmg: 26 },
    agua:      { label: "Jato d'Água",     type: 'water',    style: 'water',   count: 1, spread: 0, speed: 0.95, grav: 1.0, boom: 42, carve: 0,  dmg: 30, push: 9 },
    volt:      { label: 'Trovoada',        type: 'electric', style: 'thunder', count: 1, spread: 0, speed: 1.2,  grav: 1.0, boom: 30, carve: 14, dmg: 45 },
    investida: { label: 'Investida',       type: 'normal',   style: 'normal',  count: 1, spread: 0, speed: 1.15, grav: 0.8, boom: 30, carve: 12, dmg: 34 },
    ventania:  { label: 'Ventania',        type: 'flying',   style: 'gust',    count: 2, spread: 5, speed: 1.0,  grav: 0.6, boom: 22, carve: 6,  dmg: 19, push: 4 },
    teia:      { label: 'Teia',            type: 'bug',      style: 'web',     count: 1, spread: 0, speed: 0.9,  grav: 1.0, boom: 28, carve: 4,  dmg: 8,  web: true },
    hidro:     { label: 'Hidro Pulso',     type: 'water',    style: 'water',   count: 2, spread: 4, speed: 1.0,  grav: 1.0, boom: 28, carve: 0,  dmg: 24, push: 5 },
    furia:     { label: 'Fúria do Dragão', type: 'dragon',   style: 'dragon',  count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 38, carve: 16, dmg: 36 },
    fogo2:     { label: 'Lança-chamas+',   type: 'fire',     style: 'fire',    count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 52, carve: 32, dmg: 72 },
    planta2:   { label: 'Folha Navalha+',  type: 'grass',    style: 'leaf',    count: 4, spread: 6, speed: 0.95, grav: 0.5, boom: 26, carve: 10, dmg: 30 },
    agua2:     { label: "Jato d'Água+",    type: 'water',    style: 'water',   count: 1, spread: 0, speed: 0.95, grav: 1.0, boom: 46, carve: 0,  dmg: 40, push: 11 },
    hiperpresa:{ label: 'Hiperpresa',      type: 'normal',   style: 'normal',  count: 1, spread: 0, speed: 1.15, grav: 0.8, boom: 34, carve: 14, dmg: 48 },
    furacao:   { label: 'Furacão',         type: 'flying',   style: 'gust',    count: 3, spread: 5, speed: 1.0,  grav: 0.6, boom: 24, carve: 6,  dmg: 22, push: 5 },
    vento:     { label: 'Vento Prateado',  type: 'bug',      style: 'gust',    count: 3, spread: 5, speed: 1.0,  grav: 0.55, boom: 24, carve: 6, dmg: 20, push: 3 },
    hidrobomba:{ label: 'Hidro Bomba',     type: 'water',    style: 'water',   count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 56, carve: 0,  dmg: 70, push: 13 },
    furia2:    { label: 'Cometa Dragão',   type: 'dragon',   style: 'dragon',  count: 1, spread: 0, speed: 1.05, grav: 1.0, boom: 52, carve: 26, dmg: 64 },
    pedra:     { label: 'Lançar Pedra',    type: 'rock',     style: 'rock',    count: 1, spread: 0, speed: 1.0,  grav: 1.15, boom: 40, carve: 26, dmg: 46 },
    ferrao:    { label: 'Ferrão Venenoso', type: 'poison', style: 'poison', count: 2, spread: 3, speed: 1.12, grav: 0.85, boom: 22, carve: 3, dmg: 22 },
    pancada:   { label: 'Pancada',         type: 'normal', style: 'normal', count: 1, spread: 0, speed: 1.05, grav: 0.9, boom: 30, carve: 8, dmg: 32, push: 4 },
    lama:      { label: 'Bomba de Lama',   type: 'ground', style: 'rock', count: 1, spread: 0, speed: 1.0, grav: 1.1, boom: 34, carve: 18, dmg: 40 },
    sementes:  { label: 'Bomba de Sementes', type: 'grass', style: 'leaf', count: 2, spread: 5, speed: 0.95, grav: 0.8, boom: 26, carve: 8, dmg: 28 },
    corporal:  { label: 'Golpe Corporal',  type: 'normal', style: 'normal', count: 1, spread: 0, speed: 0.95, grav: 1.1, boom: 38, carve: 14, dmg: 50, push: 8 },
    // golpes dos Pokémon novos
    gelo:      { label: 'Raio de Gelo',    type: 'ice',      style: 'ice',     count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 36, carve: 10, dmg: 46 },
    aurora:    { label: 'Raio Aurora',     type: 'ice',      style: 'ice',     count: 1, spread: 0, speed: 1.0,  grav: 0.95, boom: 32, carve: 8,  dmg: 38, push: 5 },
    gelo2:     { label: 'Nevasca',         type: 'ice',      style: 'ice',     count: 2, spread: 5, speed: 1.0,  grav: 0.9, boom: 38, carve: 12, dmg: 40 },
    lambida:   { label: 'Lambida',         type: 'ghost',    style: 'ghost',   count: 1, spread: 0, speed: 0.95, grav: 0.8, boom: 30, carve: 4,  dmg: 32 },
    sombra:    { label: 'Bola Sombria',    type: 'ghost',    style: 'ghost',   count: 1, spread: 0, speed: 1.05, grav: 0.9, boom: 38, carve: 10, dmg: 52 },
    soco:      { label: 'Soco Focado',     type: 'fighting', style: 'punch',   count: 1, spread: 0, speed: 1.1,  grav: 0.9, boom: 28, carve: 14, dmg: 42, push: 7 },
    karate:    { label: 'Golpe de Caratê', type: 'fighting', style: 'punch',   count: 2, spread: 4, speed: 1.1,  grav: 0.9, boom: 30, carve: 12, dmg: 36, push: 9 },
    sonico:    { label: 'Onda Sônica',     type: 'flying',   style: 'gust',    count: 2, spread: 7, speed: 1.05, grav: 0.5, boom: 20, carve: 3,  dmg: 17, push: 5 },
    presa:     { label: 'Presa Venenosa',  type: 'poison',   style: 'poison',  count: 2, spread: 3, speed: 1.1,  grav: 0.85, boom: 24, carve: 4, dmg: 27 },
    pedrada:   { label: 'Atirar Pedra',    type: 'rock',     style: 'rock',    count: 1, spread: 0, speed: 1.0,  grav: 1.15, boom: 34, carve: 20, dmg: 40 },
    choque:    { label: 'Onda de Choque',  type: 'electric', style: 'thunder', count: 2, spread: 5, speed: 1.15, grav: 0.9, boom: 24, carve: 6,  dmg: 24 },
    socotrovao:{ label: 'Soco Trovão',     type: 'electric', style: 'thunder', count: 1, spread: 0, speed: 1.15, grav: 0.95, boom: 34, carve: 16, dmg: 54 },
    brasas:    { label: 'Brasas',          type: 'fire',     style: 'fire',    count: 3, spread: 7, speed: 0.95, grav: 0.9, boom: 26, carve: 10, dmg: 26 },
    presafogo: { label: 'Presa de Fogo',   type: 'fire',     style: 'fire',    count: 1, spread: 0, speed: 1.05, grav: 0.95, boom: 38, carve: 22, dmg: 50 },
    rodafogo:  { label: 'Roda de Fogo',    type: 'fire',     style: 'fire',    count: 2, spread: 5, speed: 1.0,  grav: 0.95, boom: 42, carve: 24, dmg: 48 },
    corte:     { label: 'Corte Duplo',     type: 'bug',      style: 'gust',    count: 2, spread: 6, speed: 1.15, grav: 0.55, boom: 22, carve: 6,  dmg: 29, push: 3 },
    batida:    { label: 'Batida',          type: 'normal',   style: 'normal',  count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 22, carve: 4,  dmg: 20 },
    splash:    { label: 'Splash', none: true },
    rede:      { label: 'Rede',            type: 'normal',   style: 'net',     count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 0,  carve: 0,  dmg: 0 },
    ball:      { label: 'Pokébola',        type: 'normal',   style: 'ball',    count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 0,  carve: 0,  dmg: 0 }
  };

  // ---------- Mecânicas dos golpes ----------
  // windMul: quanto o vento empurra (pedra pesada quase ignora; folha e rajada são levadas) · size: tamanho do projétil · shake: tremor da câmera
  // st: efeito de status {type,p} (burn/poison = dano por turno, freeze/sleep/para = perde a vez) · chain: arco elétrico (raio em px)
  // drain: cura quem ataca · bounce: quicadas no chão · phase: atravessa o terreno · split: abre em vários ao chegar no topo
  // homing: curva em direção ao inimigo · quake: abalo sísmico em quem está no chão · build: ergue terreno · crit: chance de golpe crítico
  Object.assign(MS.WEAPONS, {
    psiquico:  { label: 'Psíquico',        type: 'psychic',  style: 'psy',    count: 1, spread: 0, speed: 1.0,  grav: 0.75, boom: 30, carve: 4,  dmg: 36, windMul: 0.4, homing: 0.05 },
    canto:     { label: 'Canto',           type: 'normal',   style: 'sound',  count: 1, spread: 0, speed: 0.95, grav: 0.6,  boom: 54, carve: 0,  dmg: 12, windMul: 1.5, st: { type: 'sleep', p: 0.6 } },
    po:        { label: 'Pó do Sono',      type: 'bug',      style: 'powder', count: 1, spread: 0, speed: 0.95, grav: 0.5,  boom: 50, carve: 0,  dmg: 8,  windMul: 1.9, st: { type: 'sleep', p: 0.7 } },
    pedrinha:  { label: 'Pedregulho',      type: 'rock',     style: 'rock',   count: 1, spread: 0, speed: 1.0,  grav: 1.3,  boom: 24, carve: 10, dmg: 24, windMul: 0.3, size: 0.7 },
    avalanche: { label: 'Avalanche',       type: 'rock',     style: 'rock',   count: 1, spread: 0, speed: 1.1,  grav: 1.3,  boom: 22, carve: 8,  dmg: 26, windMul: 0.25, size: 1.3, split: { n: 5, wk: 'pedrinha' } },
    rolamento: { label: 'Rolamento',       type: 'rock',     style: 'rock',   count: 1, spread: 0, speed: 1.0,  grav: 1.2,  boom: 30, carve: 12, dmg: 32, windMul: 0.3, size: 1.1, bounce: 3 },
    terremoto: { label: 'Terremoto',       type: 'ground',   style: 'rock',   count: 1, spread: 0, speed: 1.05, grav: 1.3,  boom: 22, carve: 14, dmg: 30, windMul: 0.3, size: 1.1, quake: 170, shake: 10 },
    semente:   { label: 'Semente',         type: 'grass',    style: 'leaf',   count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 20, carve: 6,  dmg: 17 }
  });
  const P = (k, o) => Object.assign(MS.WEAPONS[k], o);
  const P0 = (k, o) => { MS.WEAPONS[k] = o; };
  // Cavar: entra no chão, abre um túnel e explode lá dentro (quem estiver em cima despenca)
  P0('cavar', { label: 'Cavar', type: 'ground', style: 'rock', count: 1, spread: 0, speed: 1.05, grav: 1.15, boom: 40, carve: 30, dmg: 50, windMul: 0.3, size: 1.2, dig: 66, digR: 12, shake: 9 });
  // ---------- Golpes especiais (extras de algumas espécies; alternar com G) ----------
  P0('subterra',   { label: 'Ataque Subterrâneo', type: 'ground',   style: 'rock',    count: 1, spread: 0, speed: 1.0,  grav: 1.1, boom: 34, carve: 22, dmg: 46, windMul: 0.4, size: 0.9, burrow: 240 });
  P0('raioceu',    { label: 'Raio do Céu',        type: 'electric', style: 'thunder', count: 1, spread: 0, speed: 1.05, grav: 1.0, boom: 18, carve: 6,  dmg: 10, windMul: 0.8, size: 0.8, bolts: [0], bdmg: 46 });
  P0('tempestade', { label: 'Tempestade',         type: 'electric', style: 'thunder', count: 1, spread: 0, speed: 1.05, grav: 1.0, boom: 18, carve: 6,  dmg: 8,  windMul: 0.8, size: 0.9, bolts: [-46, 0, 46], bdmg: 30 });
  P0('fissura',    { label: 'Fissura',            type: 'ground',   style: 'rock',    count: 1, spread: 0, speed: 1.0,  grav: 1.3, boom: 62, carve: 66, dmg: 14, windMul: 0.3, size: 1.35, shake: 14 });
  P0('teleporte',  { label: 'Teleporte',          type: 'psychic',  style: 'psy',     count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 0,  carve: 0,  dmg: 0,  windMul: 0.5, size: 0.9, teleport: true });
  P0('hiperraio',  { label: 'Hiper Raio',         type: 'normal',   style: 'normal',  count: 1, spread: 0, speed: 1.15, grav: 0.8, boom: 28, carve: 12, dmg: 18, windMul: 0.4, size: 1.0, beam: 54 });
  P0('redemoinho', { label: 'Redemoinho',         type: 'flying',   style: 'gust',    count: 1, spread: 0, speed: 1.0,  grav: 0.8, boom: 40, carve: 4,  dmg: 12, windMul: 1.2, size: 1.15, pull: 125, pullDist: 75 });
  P0('protecao',   { label: 'Proteção',           type: 'normal',   style: 'normal',  count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 0,  carve: 0,  dmg: 0,  windMul: 0,   size: 1.0, protect: 2 });
  P0('casca', { label: 'Casca Dura', type: 'bug', style: 'rock', count: 1, spread: 0, speed: 1.0, grav: 1.1, boom: 26, carve: 4, dmg: 16, windMul: 0.6, size: 0.85, shake: 4 });
  // pesados
  P('pedra',   { speed: 1.12, grav: 1.45, boom: 42, dmg: 52, windMul: 0.2, size: 1.55, shake: 12 });
  P('pedrada', { speed: 1.1,  grav: 1.35, boom: 36, dmg: 42, windMul: 0.25, size: 1.2, shake: 9 });
  P('lama',    { speed: 1.0,  grav: 1.3,  windMul: 0.35, size: 1.1, build: 22, carve: 0, shake: 7 });
  P('corporal',{ windMul: 0.35, grav: 1.25, shake: 11, push: 12 });
  P('pancada', { windMul: 0.6 });
  // leves (o vento leva)
  P('planta',  { windMul: 1.7 }); P('planta2', { windMul: 1.6, drain: 0.25 });
  P('ventania',{ windMul: 2.0 }); P('furacao', { windMul: 1.8 }); P('vento', { windMul: 1.8 }); P('sonico', { windMul: 1.7 });
  P('teia',    { windMul: 1.3 });
  P('sementes',{ count: 1, spread: 0, boom: 22, dmg: 20, windMul: 1.1, split: { n: 3, wk: 'semente' } });
  // rápidos e secos
  P('investida', { windMul: 0.6, crit: 0.15 }); P('hiperpresa', { windMul: 0.6, crit: 0.3 }); P('corte', { windMul: 0.5, crit: 0.3 });
  P('soco', { crit: 0.2, push: 11, windMul: 0.5 }); P('karate', { push: 12, windMul: 0.5, crit: 0.15 });
  // efeitos de status
  P('fogo',   { st: { type: 'burn', p: 0.35 } }); P('fogo2', { st: { type: 'burn', p: 0.45 } });
  P('brasas', { st: { type: 'burn', p: 0.3 } }); P('presafogo', { st: { type: 'burn', p: 0.5 } }); P('rodafogo', { st: { type: 'burn', p: 0.4 } });
  P('ferrao', { st: { type: 'poison', p: 0.45 } }); P('presa', { st: { type: 'poison', p: 0.5 } });
  P('gelo', { st: { type: 'freeze', p: 0.3 } }); P('aurora', { st: { type: 'freeze', p: 0.3 } }); P('gelo2', { st: { type: 'freeze', p: 0.35 } });
  P('volt', { chain: 75, st: { type: 'para', p: 0.25 } }); P('choque', { chain: 55, st: { type: 'para', p: 0.35 } }); P('socotrovao', { st: { type: 'para', p: 0.4 } });
  P('lambida', { phase: true, st: { type: 'para', p: 0.35 } }); P('sombra', { phase: true });
  P('hidro', { windMul: 0.8 }); P('agua', { windMul: 0.9 });

  // ---------- Variantes de golpe ----------
  // Cada indivíduo tem um "conjunto de golpes": 'b' = golpe padrão da espécie, 'a' / 'c' = variantes da espécie
  // e combinações raras como 'b+a' (o Pokémon tem os dois e o jogador alterna entre eles).
  const MODES = {
    power:  w => ({ dmg: Math.round(w.dmg * 1.32), boom: Math.round(w.boom * 1.15), carve: Math.round(w.carve * 1.2) }),
    area:   w => ({ boom: Math.round(w.boom * 1.6), dmg: Math.round(w.dmg * 0.92), carve: Math.round(w.carve * 1.4), push: w.push ? Math.round(w.push * 1.3) : w.push }),
    multi:  w => ({ count: w.count + 2, spread: Math.max(w.spread, 6), dmg: Math.round(w.dmg * 0.6), boom: Math.round(w.boom * 0.85), carve: Math.round(w.carve * 0.7) }),
    sniper: w => ({ speed: +(w.speed * 1.28).toFixed(2), grav: +(w.grav * 0.7).toFixed(2), dmg: Math.round(w.dmg * 1.22), boom: Math.round(w.boom * 0.9) })
  };
  MS.MODE_NOTE = { power: 'mais forte', area: 'mais área', multi: 'vários tiros', sniper: 'tiro rápido' };

  // ---------- Espécies ----------
  // h: altura visual (posição do nome); hitY/hitR: centro e raio da área de acerto;
  // catch: facilidade de captura; mouth: de onde sai o tiro.
  MS.SPECIES = {
    charmander: { name: 'Charmander', types: ['fire'],              weapon: 'fogo',      maxhp: 100, h: 36, hitY: 9,  hitR: 11, catch: 0.5,  mouth: [11, -18], evo: 'charmeleon', evoXp: 220 },
    bulbasaur:  { name: 'Bulbasaur',  types: ['grass'],             weapon: 'planta',    maxhp: 100, h: 38, hitY: 9,  hitR: 11, catch: 0.5,  mouth: [11, -18], evo: 'ivysaur', evoXp: 220 },
    squirtle:   { name: 'Squirtle',   types: ['water'],             weapon: 'agua',      maxhp: 100, h: 30, hitY: 9,  hitR: 11, catch: 0.5,  mouth: [11, -17], evo: 'wartortle', evoXp: 220 },
    pikachu:    { name: 'Pikachu',    types: ['electric'],          weapon: 'volt',      maxhp: 100, h: 44, hitY: 14, hitR: 14, catch: 0.45, mouth: [0, -34] },
    rattata:    { name: 'Rattata',    types: ['normal'],            weapon: 'investida', maxhp: 70,  h: 32, hitY: 9,  hitR: 11, catch: 1.0,  mouth: [12, -15], evo: 'raticate', evoXp: 170 },
    pidgey:     { name: 'Pidgey',     types: ['normal', 'flying'],  weapon: 'ventania',  maxhp: 70,  h: 40, hitY: 13, hitR: 12, catch: 1.0,  mouth: [14, -22], evo: 'pidgeotto', evoXp: 170 },
    caterpie:   { name: 'Caterpie',   types: ['bug'],               weapon: 'teia',      maxhp: 60,  h: 32, hitY: 8,  hitR: 11, catch: 1.1,  mouth: [15, -8], evo: 'metapod', evoXp: 110 },
    starmie:    { name: 'Starmie',    types: ['water', 'psychic'],  weapon: 'psiquico',     maxhp: 90,  h: 46, hitY: 22, hitR: 15, catch: 0.55, mouth: [14, -26] },
    magikarp:   { name: 'Magikarp',   types: ['water'],             weapon: 'splash',    maxhp: 50,  h: 38, hitY: 11, hitR: 13, catch: 1.25, mouth: [14, -9], evo: 'gyarados', evoXp: 120, xpMul: 1.5 },
    dratini:    { name: 'Dratini',    types: ['dragon'],            weapon: 'furia',     maxhp: 90, h: 36, hitY: 13, hitR: 12, catch: 0.5, mouth: [16, -20], scale: 1.0, evo: 'dragonair', evoXp: 260 },
    // formas evoluídas (um estágio só) e visitantes
    charmeleon: { name: 'Charmeleon', types: ['fire'],              weapon: 'fogo2',      maxhp: 130, h: 40, hitY: 11, hitR: 12, catch: 0.3,  mouth: [13, -21], scale: 1.12 },
    ivysaur:    { name: 'Ivysaur',    types: ['grass'],             weapon: 'planta2',    maxhp: 130, h: 42, hitY: 11, hitR: 12, catch: 0.3,  mouth: [12, -19], scale: 1.12 },
    wartortle:  { name: 'Wartortle',  types: ['water'],             weapon: 'agua2',      maxhp: 130, h: 38, hitY: 11, hitR: 12, catch: 0.3,  mouth: [12, -17], scale: 1.12 },
    raticate:   { name: 'Raticate',   types: ['normal'],            weapon: 'hiperpresa', maxhp: 100, h: 38, hitY: 11, hitR: 12, catch: 0.5,  mouth: [14, -16], scale: 1.15 },
    pidgeotto:  { name: 'Pidgeotto',  types: ['normal', 'flying'],  weapon: 'furacao',    maxhp: 100, h: 46, hitY: 15, hitR: 13, catch: 0.5,  mouth: [16, -23], scale: 1.15 },
    butterfree: { name: 'Butterfree', types: ['bug', 'flying'],     weapon: 'vento',      maxhp: 95,  h: 56, hitY: 27, hitR: 15, catch: 0.4,  mouth: [10, -30], scale: 1.1 },
    gyarados:   { name: 'Gyarados',   types: ['water', 'flying'],   weapon: 'hidrobomba', maxhp: 180, h: 62, hitY: 26, hitR: 17, catch: 0.2,  mouth: [20, -42], scale: 1.1 },
    dragonair:  { name: 'Dragonair',  types: ['dragon'],            weapon: 'furia2',     maxhp: 170, h: 66, hitY: 28, hitR: 15, catch: 0.2,  mouth: [19, -39], scale: 1.1 },
    onix:       { name: 'Onix',       types: ['rock', 'ground'],    weapon: 'cavar',      maxhp: 170, h: 70, hitY: 30, hitR: 19, catch: 0.3,  mouth: [18, -48] },
    // Conceitos aprovados: versões fixadas em animated-kanto.js.
    beedrill:   { name: 'Beedrill',   types: ['bug', 'poison'],     weapon: 'ferrao',     maxhp: 95, h: 43, hitY: 19, hitR: 13, catch: 0.55, mouth: [13, -20] },
    jigglypuff: { name: 'Jigglypuff', types: ['normal'],            weapon: 'canto',    maxhp: 80, h: 40, hitY: 18, hitR: 15, catch: 0.85, mouth: [13, -24] },
    dugtrio:    { name: 'Dugtrio',    types: ['ground'],            weapon: 'lama',       maxhp: 105, h: 39, hitY: 17, hitR: 15, catch: 0.60, mouth: [9, -23] },
    exeggutor:  { name: 'Exeggutor',  types: ['grass', 'psychic'],  weapon: 'sementes',   maxhp: 125, h: 49, hitY: 22, hitR: 16, catch: 0.40, mouth: [12, -27] },
    snorlax:    { name: 'Snorlax',    types: ['normal'],            weapon: 'corporal',   maxhp: 175, h: 43, hitY: 18, hitR: 18, catch: 0.25, mouth: [11, -23], scale: 1.1 },
    // ---- segunda leva: Fantasma, Gelo e Lutador ----
    geodude:    { name: 'Geodude',    types: ['rock', 'ground'],    weapon: 'pedrada',    maxhp: 95,  h: 30, hitY: 11, hitR: 13, catch: 0.6,  mouth: [12, -14], evo: 'graveler', evoXp: 200 },
    zubat:      { name: 'Zubat',      types: ['poison', 'flying'],  weapon: 'sonico',     maxhp: 60,  h: 44, hitY: 20, hitR: 12, catch: 0.9,  mouth: [10, -18], evo: 'golbat', evoXp: 170 },
    golbat:     { name: 'Golbat',     types: ['poison', 'flying'],  weapon: 'presa',      maxhp: 115, h: 52, hitY: 22, hitR: 14, catch: 0.45, mouth: [12, -20], scale: 1.12 },
    gastly:     { name: 'Gastly',     types: ['ghost', 'poison'],   weapon: 'lambida',    maxhp: 65,  h: 46, hitY: 22, hitR: 13, catch: 0.7,  mouth: [10, -22], evo: 'gengar', evoXp: 300 },
    gengar:     { name: 'Gengar',     types: ['ghost', 'poison'],   weapon: 'sombra',     maxhp: 135, h: 48, hitY: 19, hitR: 15, catch: 0.22, mouth: [12, -24], scale: 1.1 },
    machop:     { name: 'Machop',     types: ['fighting'],          weapon: 'soco',       maxhp: 110, h: 42, hitY: 16, hitR: 13, catch: 0.55, mouth: [13, -18], evo: 'machamp', evoXp: 280 },
    machamp:    { name: 'Machamp',    types: ['fighting'],          weapon: 'karate',     maxhp: 170, h: 54, hitY: 22, hitR: 17, catch: 0.2,  mouth: [14, -26], scale: 1.1 },
    growlithe:  { name: 'Growlithe',  types: ['fire'],              weapon: 'presafogo',  maxhp: 100, h: 34, hitY: 13, hitR: 13, catch: 0.5,  mouth: [14, -16], evo: 'arcanine', evoXp: 300 },
    arcanine:   { name: 'Arcanine',   types: ['fire'],              weapon: 'rodafogo',   maxhp: 160, h: 50, hitY: 19, hitR: 17, catch: 0.2,  mouth: [18, -24], scale: 1.12 },
    seel:       { name: 'Seel',       types: ['water', 'ice'],      weapon: 'aurora',     maxhp: 100, h: 32, hitY: 12, hitR: 14, catch: 0.7,  mouth: [14, -12], evo: 'dewgong', evoXp: 200 },
    lapras:     { name: 'Lapras',     types: ['water', 'ice'],      weapon: 'gelo2',      maxhp: 175, h: 54, hitY: 20, hitR: 19, catch: 0.22, mouth: [18, -34], scale: 1.1 },
    magnemite:  { name: 'Magnemite',  types: ['electric'],          weapon: 'choque',     maxhp: 70,  h: 40, hitY: 20, hitR: 12, catch: 0.7,  mouth: [10, -20], evo: 'magneton', evoXp: 180 },
    electabuzz: { name: 'Electabuzz', types: ['electric'],          weapon: 'socotrovao', maxhp: 125, h: 62, hitY: 26, hitR: 16, catch: 0.35, mouth: [14, -34] },
    magmar:     { name: 'Magmar',     types: ['fire'],              weapon: 'brasas',     maxhp: 125, h: 50, hitY: 20, hitR: 15, catch: 0.35, mouth: [14, -24] },
    scyther:    { name: 'Scyther',    types: ['bug', 'flying'],     weapon: 'corte',      maxhp: 115, h: 56, hitY: 22, hitR: 14, catch: 0.35, mouth: [14, -26] },
    // evoluções novas: Caterpie -> Metapod -> Butterfree, Geodude -> Graveler, Magnemite -> Magneton, Seel -> Dewgong
    metapod:    { name: 'Metapod',    types: ['bug'],               weapon: 'casca',      maxhp: 80,  h: 30, hitY: 9,  hitR: 11, catch: 0.9,  mouth: [10, -14], evo: 'butterfree', evoXp: 240 },
    graveler:   { name: 'Graveler',   types: ['rock', 'ground'],    weapon: 'pedra',      maxhp: 140, h: 40, hitY: 15, hitR: 16, catch: 0.35, mouth: [16, -20], scale: 1.1 },
    magneton:   { name: 'Magneton',   types: ['electric'],          weapon: 'volt',       maxhp: 115, h: 44, hitY: 22, hitR: 14, catch: 0.4,  mouth: [14, -26], scale: 1.05 },
    dewgong:    { name: 'Dewgong',    types: ['water', 'ice'],      weapon: 'gelo2',      maxhp: 150, h: 40, hitY: 14, hitR: 17, catch: 0.3,  mouth: [22, -16], scale: 1.1 }
  };

  // Variantes por espécie: [modo, nome]. 'a' = 1ª variante, 'c' = 2ª. { wk } usa um golpe já existente.
  const ALTS = {
    charmander: [['power', 'Chama Intensa'], ['multi', 'Rajada de Brasas']],
    bulbasaur:  [['multi', 'Tempestade de Folhas'], ['power', 'Folha Cortante']],
    squirtle:   [['power', 'Jato Potente'], ['area', 'Onda de Água']],
    pikachu:    [['power', 'Trovão'], ['area', 'Descarga Ampla']],
    rattata:    [['sniper', 'Investida Rápida'], ['power', 'Mordida Forte']],
    pidgey:     [['power', 'Rajada Cortante'], ['multi', 'Tornado']],
    caterpie:   [['area', 'Teia Gigante']],
    starmie:    [{ wk: 'hidro' }, ['area', 'Maré Cósmica']],
    magikarp:   [{ wk: 'batida' }],
    dratini:    [['power', 'Fúria Intensa'], ['area', 'Onda Dracônica']],
    charmeleon: [['power', 'Chama Intensa+'], ['multi', 'Rajada Ígnea']],
    ivysaur:    [['multi', 'Tempestade Verde'], ['power', 'Chicote Cortante']],
    wartortle:  [['power', 'Jato Potente+'], ['area', 'Maremoto']],
    raticate:   [['sniper', 'Presa Veloz'], ['area', 'Mordida Brutal']],
    pidgeotto:  [['power', 'Furacão Cortante'], ['multi', 'Tornado Duplo']],
    butterfree: [{ wk: 'po' }, ['multi', 'Vendaval de Asas']],
    gyarados:   [['area', 'Maremoto Furioso'], ['sniper', 'Jato Perfurante']],
    dragonair:  [['power', 'Cometa Brutal'], ['area', 'Aurora Dracônica']],
    onix:       [{ wk: 'avalanche' }, ['sniper', 'Cavar Veloz']],
    beedrill:   [['multi', 'Chuva de Ferrões'], ['power', 'Ferrão Mortal']],
    jigglypuff: [{ wk: 'pancada' }, ['area', 'Canto Sonoro']],
    dugtrio:    [{ wk: 'terremoto' }, ['power', 'Lama Pesada']],
    exeggutor:  [['multi', 'Chuva de Sementes'], ['power', 'Semente Explosiva']],
    snorlax:    [['area', 'Pancada Gigante'], ['power', 'Hiperpresa Pesada']],
    geodude:    [{ wk: 'rolamento' }, ['sniper', 'Pedrada Veloz']],
    zubat:      [['multi', 'Onda Sônica Tripla'], ['power', 'Asa Cortante']],
    golbat:     [['power', 'Presa Letal'], ['multi', 'Chuva de Presas']],
    gastly:     [['area', 'Nuvem Sombria'], ['power', 'Lambida Gélida']],
    gengar:     [['area', 'Sombra Gigante'], ['multi', 'Chuva de Sombras']],
    machop:     [['power', 'Soco Dinâmico'], ['area', 'Golpe Sísmico']],
    machamp:    [['multi', 'Mil Socos'], ['power', 'Golpe Cruzado']],
    growlithe:  [['power', 'Presa Ardente'], ['multi', 'Chama Dupla']],
    arcanine:   [['power', 'Roda Infernal'], ['area', 'Onda Ígnea']],
    seel:       [['power', 'Aurora Forte'], ['multi', 'Chuva de Gelo']],
    lapras:     [['power', 'Raio Congelante'], ['area', 'Nevasca Total']],
    magnemite:  [['area', 'Pulso Magnético'], ['power', 'Choque Pesado']],
    electabuzz: [['power', 'Trovão Brutal'], ['area', 'Descarga Elétrica']],
    magmar:     [['power', 'Lança-chamas Magmar'], ['area', 'Erupção']],
    scyther:    [['sniper', 'Corte Veloz'], ['power', 'Lâmina Brutal']]
  };
  for (const sp in ALTS) {
    const S = MS.SPECIES[sp]; S.alts = []; S.altKeys = [];
    ALTS[sp].forEach((a, i) => {
      if (Array.isArray(a)) {
        const base = MS.WEAPONS[S.weapon], key = `${S.weapon}~${sp}${i}`;
        MS.WEAPONS[key] = Object.assign({}, base, MODES[a[0]](base), { label: a[1], variant: a[0] });
        S.altKeys.push(key);
      } else S.altKeys.push(a.wk);
    });
  }

  // golpes (chaves de arma) de um indivíduo; mvs = 'b' | 'a' | 'c' | 'b+a' | 'b+c'
  MS.movesOf = (sp, mvs) => {
    const S = MS.SPECIES[sp], out = [];
    for (const t of String(mvs || 'b').split('+')) {
      const k = t === 'a' ? S.altKeys && S.altKeys[0] : t === 'c' ? S.altKeys && S.altKeys[1] : S.weapon;
      const wk = k || S.weapon;
      if (!out.includes(wk)) out.push(wk);
    }
    for (const wk of S.extra || []) if (!out.includes(wk)) out.push(wk);   // golpe especial da espécie, sempre disponível
    return out;
  };
  MS.cleanMv = (sp, mvs) => {
    const S = MS.SPECIES[sp], ok = new Set(['b', 'a', 'c']);
    const toks = String(mvs || 'b').split('+').filter(t => ok.has(t) && (t === 'b' || (S.altKeys && S.altKeys[t === 'a' ? 0 : 1])));
    return toks.length ? Array.from(new Set(toks)).join('+') : 'b';
  };
  // sorteia o conjunto de golpes de um indivíduo selvagem: bonus aumenta a chance de variantes raras
  MS.rollMoves = (sp, bonus = 0) => {
    const S = MS.SPECIES[sp], n = S.altKeys ? S.altKeys.length : 0;
    if (!n) return 'b';
    const r = Math.random(), pick = () => (n > 1 && Math.random() < 0.5 ? 'c' : 'a');
    if (r < 0.55 - bonus) return 'b';
    if (r < 0.86 - bonus * 0.5) return pick();
    return 'b+' + pick();
  };

  // ---------- Faixa de mira (como os mobiles) ----------
  // Ângulos que cada espécie consegue escolher, medidos a partir do corpo (que inclina com o chão).
  // Fracos escolhem quase qualquer ângulo; fortes têm faixa estreita e precisam andar até um morro para mudar.
  MS.AIM_TIERS = { wide: [0, 180], basic: [0, 90], mid: [15, 75], narrow: [30, 60] };
  const AIM_OF = {
    caterpie: 'wide', metapod: 'wide', magikarp: 'wide', rattata: 'wide', pidgey: 'wide', zubat: 'wide', gastly: 'wide', magnemite: 'wide', jigglypuff: 'wide',
    charmeleon: 'mid', ivysaur: 'mid', wartortle: 'mid', golbat: 'mid', graveler: 'mid', magneton: 'mid', dewgong: 'mid', electabuzz: 'mid', magmar: 'mid', scyther: 'mid', exeggutor: 'mid',
    gyarados: 'narrow', dragonair: 'narrow', onix: 'narrow', snorlax: 'narrow', gengar: 'narrow', machamp: 'narrow', arcanine: 'narrow', lapras: 'narrow'
  };
  // golpes especiais extras de cada espécie (somam aos golpes normais)
  const EXTRA = {
    dugtrio: ['subterra'], geodude: ['fissura'], graveler: ['fissura'], onix: ['fissura'],
    pikachu: ['raioceu'], magneton: ['raioceu'], electabuzz: ['tempestade'],
    starmie: ['teleporte'], exeggutor: ['teleporte'],
    gyarados: ['hiperraio'], dragonair: ['hiperraio'], snorlax: ['hiperraio'], pidgeotto: ['hiperraio'],
    pidgey: ['redemoinho'], butterfree: ['redemoinho'], golbat: ['redemoinho'],
    metapod: ['protecao'], squirtle: ['protecao'], wartortle: ['protecao'], lapras: ['protecao']
  };
  for (const sp in EXTRA) if (MS.SPECIES[sp]) MS.SPECIES[sp].extra = EXTRA[sp];
  MS.aimRange = sp => MS.AIM_TIERS[AIM_OF[sp] || 'basic'];

  // ---------- Cenários ----------
  // sky/far/near/dirt: cores dos degradês; g: grama (borda, brilho, tufos); sea: mar (fundo, frente)
  MS.THEMES = {
    cidade: {
      sky: ['#3f86d4', '#9cd0f0', '#f6ebc8'], far: ['#a9c4dc', '#d3e1ec'], near: ['#7fae8c', '#b4d2a8'], tl: '#7f97ad',
      dirt: ['#a07040', '#744a2a', '#3d2616'], s1: '#4a2c16', s2: '#2a180c', g: ['#3f8a2a', '#8fd14f', '#5aa834'],
      sea: ['#3b86c4', '#1b4a7a', '#4aa3e0', '#123a63'], fore: '#1d3d22',
      decor: [], sun: { x: 660, y: 92, col: '#fff3c4', glow: 1 }, clouds: 1, terrain: { base: 420, amp: 0 }
    },
    campo: {
      sky: ['#3a78c2', '#8cc4ea', '#f3e2b8'], far: ['#9db8d6', '#c9d9e6'], near: ['#6f9f84', '#a8c7a0'], tl: '#4f7f5c',
      dirt: ['#9a6a3c', '#6e4526', '#3a2414'], s1: '#4a2c16', s2: '#2a180c', g: ['#3f8a2a', '#8fd14f', '#5aa834'],
      sea: ['#3b86c4', '#1b4a7a', '#4aa3e0', '#123a63'], fore: '#14301a',
      decor: ['tree', 'bush', 'flower', 'flower', 'rock', 'pine'], sun: { x: 660, y: 92, col: '#fff3c4', glow: 1 },
      clouds: 1, terrain: { base: 285, amp: 1 }
    },
    floresta: {
      sky: ['#1f5a45', '#5fa07a', '#c8e4b0'], far: ['#4f7f66', '#8fb89a'], near: ['#35704a', '#6fa57e'], tl: '#245a38',
      dirt: ['#6d5a32', '#4a3a22', '#261c10'], s1: '#3a2c18', s2: '#1e160c', g: ['#2a7424', '#68bc46', '#3f9a30'],
      sea: ['#2e7a6a', '#164a42', '#3a9a88', '#103c36'], fore: '#0c2412',
      decor: ['pine', 'pine', 'tree', 'tree', 'bush', 'rock', 'flower'], sun: { x: 620, y: 80, col: '#e8f5c0', glow: 0.5 },
      clouds: 0.5, terrain: { base: 285, amp: 1.1 }
    },
    praia: {
      sky: ['#2b98d8', '#8fd8f0', '#fdf0cf'], far: ['#8fb8d0', '#cfe3ee'], near: ['#7fc4b0', '#bfe3d0'], tl: '#4d9a7a',
      dirt: ['#ead59c', '#c9ad6e', '#8a7040'], s1: '#a98c52', s2: '#70582c', g: ['#d4b870', '#f6e4a8', '#cdb06a'],
      sea: ['#2f9ad0', '#18608a', '#58c0f0', '#14507a'], fore: '#4d7a3a',
      decor: ['palm', 'palm', 'rock', 'bush', 'flower'], sun: { x: 660, y: 92, col: '#fff3c4', glow: 1 },
      clouds: 1, terrain: { base: 312, amp: 0.55 }
    },
    caverna: {
      sky: ['#140e28', '#271e4a', '#3e3266'], far: ['#2a2250', '#3a3068'], near: ['#221a40', '#30265a'], tl: '#181230',
      dirt: ['#5a5266', '#3e3748', '#201c28'], s1: '#2e2838', s2: '#16121e', g: ['#6a6478', '#a8a0bc', '#8a829c'],
      sea: ['#3a3a7a', '#1a1a44', '#4a4a9a', '#14143a'], fore: '#0c0818',
      decor: ['stalag', 'stalag', 'crystal', 'rock', 'crystal'], sun: null, clouds: 0, terrain: { base: 290, amp: 1 }
    },
    montanha: {
      sky: ['#1f2748', '#5b4880', '#f0a070'], far: ['#7a6a98', '#b49ab8'], near: ['#4a4268', '#7a6a8e'], tl: '#2e2848',
      dirt: ['#7a6a60', '#52463e', '#2a2220'], s1: '#3c322c', s2: '#1e1816', g: ['#8a7a74', '#cbbab0', '#a89890'],
      sea: ['#3a4a8a', '#1a2250', '#5a6aaa', '#141a40'], fore: '#120e1c',
      decor: ['rock', 'pine', 'rock', 'stalag'], sun: { x: 150, y: 215, col: '#ffb36b', glow: 1 },
      clouds: 0.6, terrain: { base: 280, amp: 1.25 }
    },
    noite: {
      sky: ['#0e0b24', '#2a1f55', '#5a3f86'], far: ['#2a2150', '#43347a'], near: ['#241c48', '#38306a'], tl: '#150f2e',
      dirt: ['#4e4668', '#342d4a', '#1c1828'], s1: '#2a2440', s2: '#13101e', g: ['#4f4a78', '#8a84c0', '#6a64a0'],
      sea: ['#3a2a6a', '#1a1040', '#503a8a', '#120a30'], fore: '#0a0716',
      decor: ['tomb', 'tomb', 'deadtree', 'deadtree', 'rock', 'tomb'], sun: { x: 640, y: 92, col: '#e8e4ff', glow: 0.7 },
      clouds: 0.3, terrain: { base: 285, amp: 1 }
    },
    usina: {
      sky: ['#4a3a58', '#c0705a', '#f0b070'], far: ['#6a5870', '#a07880'], near: ['#4e4458', '#7a6270'], tl: '#2e2838',
      dirt: ['#6a6258', '#4a443c', '#26221e'], s1: '#3a342e', s2: '#1c1814', g: ['#6a7a50', '#a8b878', '#889860'],
      sea: ['#4a6a7a', '#223848', '#608898', '#1a2e3c'], fore: '#14101c',
      decor: ['pylon', 'pylon', 'rock', 'bush', 'pylon'], sun: { x: 150, y: 205, col: '#ffcf8a', glow: 1 },
      clouds: 0.7, terrain: { base: 288, amp: 1 }
    },
    cabo: {
      sky: ['#1c4a8a', '#5a9ad0', '#f0d8b0'], far: ['#7898c0', '#b0c8e0'], near: ['#5c88a8', '#98b8cc'], tl: '#3f6a8a',
      dirt: ['#8a8a98', '#5e5e6e', '#34343e'], s1: '#4a4a58', s2: '#26262e', g: ['#5a8a6a', '#9ac89a', '#78a888'],
      sea: ['#2a78b8', '#124a80', '#4aa0e0', '#0e3c6a'], fore: '#1a3a30',
      decor: ['rock', 'rock', 'pine', 'bush', 'flower', 'rock'], sun: { x: 600, y: 96, col: '#fff0c0', glow: 1 },
      clouds: 1, terrain: { base: 300, amp: 0.9 }
    },
    gelo: {
      sky: ['#7ab0d8', '#c4e4f4', '#f4fbff'], far: ['#b8d4e8', '#e0eef8'], near: ['#9cc0dc', '#cfe4f2'], tl: '#8cb4d4',
      dirt: ['#b4d4e8', '#7ea8c8', '#4a708e'], s1: '#6a90b0', s2: '#3a5a78', g: ['#e8f4fc', '#ffffff', '#cfe4f4'],
      sea: ['#4a90b8', '#1e5880', '#6ab8e0', '#164a6a'], fore: '#8ab0cc',
      decor: ['icespike', 'icespike', 'snowpine', 'snowpine', 'rock'], sun: { x: 620, y: 90, col: '#ffffff', glow: 0.6 },
      clouds: 0.8, terrain: { base: 285, amp: 1.1 }
    },
    lava: {
      sky: ['#2a0e0e', '#7a2a14', '#e0701c'], far: ['#5a2018', '#8a3820'], near: ['#42180f', '#6a2a18'], tl: '#2a0e0a',
      dirt: ['#5a3a30', '#3a2420', '#1e1210'], s1: '#2e1a16', s2: '#150a08', g: ['#4a3a38', '#7a5a50', '#5e4640'],
      sea: ['#ff8a1a', '#b02a08', '#ffc040', '#8a1a04'], fore: '#120606',
      decor: ['ember', 'ember', 'rock', 'volrock', 'volrock'], sun: { x: 560, y: 120, col: '#ffb060', glow: 1 },
      clouds: 0.15, terrain: { base: 290, amp: 1.15 }
    },
    vitoria: {
      sky: ['#e0804a', '#f6c07a', '#fff0c8'], far: ['#b88a70', '#e0b898'], near: ['#a67a62', '#cca084'], tl: '#7a5a48',
      dirt: ['#b48860', '#865c3a', '#4e3220'], s1: '#6a4a32', s2: '#34241a', g: ['#a8964a', '#e0cc7a', '#c4b05e'],
      sea: ['#4a88b0', '#1e5078', '#6ab0d8', '#163e60'], fore: '#3a2c1c',
      decor: ['pillar', 'pillar', 'rock', 'banner', 'bush'], sun: { x: 130, y: 130, col: '#fff0b0', glow: 1.1 },
      clouds: 0.7, terrain: { base: 285, amp: 1.2 }
    }
  };

  // ---------- Fases da campanha ----------
  // err: erro de mira do inimigo em graus (menor = mais preciso); wind: vento máximo
  // ---------- Voadores (visitantes ficam no ar), shiny e notas dos golpes ----------
  ['pidgey', 'pidgeotto', 'butterfree', 'zubat', 'golbat', 'scyther', 'beedrill', 'gastly', 'magnemite', 'magneton'].forEach(k => { if (MS.SPECIES[k]) MS.SPECIES[k].fly = true; });
  // rotação de matiz (graus) do visual shiny, por tipo principal; a espécie pode definir `sh` próprio
  const SH_TYPE = { fire: 180, water: 130, grass: 100, electric: 160, normal: 200, bug: 120, flying: 150, psychic: 120, dragon: 140, rock: 60, ground: 320, poison: 80, ice: 100, fighting: 160, ghost: 140 };
  Object.keys(MS.SPECIES).forEach(k => { const S = MS.SPECIES[k]; if (S.sh === undefined) S.sh = SH_TYPE[S.types[0]] || 150; });
  MS.SHINY_P = 1 / 1000;
  const NOTE = { windMul: v => (v <= 0.35 ? 'pesado' : v >= 1.4 ? 'leve (vento leva)' : ''), };
  MS.moveNote = wp => {
    const a = [];
    if (wp.windMul !== undefined && wp.windMul <= 0.35) a.push('pesado: ignora o vento');
    else if (wp.windMul >= 1.4) a.push('leve: o vento leva');
    if (wp.bounce) a.push('quica ' + wp.bounce + 'x');
    if (wp.split) a.push('se divide no ar');
    if (wp.homing) a.push('busca o alvo');
    if (wp.phase) a.push('atravessa o chão');
    if (wp.dig) a.push('cava um túnel');
    if (wp.burrow) a.push('anda por baixo da terra e acerta por baixo');
    if (wp.bolts) a.push(wp.bolts.length > 1 ? 'chama ' + wp.bolts.length + ' raios do céu' : 'chama um raio do céu');
    if (wp.carve >= 50 && wp.dmg <= 20) a.push('quebra muito terreno, pouco dano');
    if (wp.teleport) a.push('teleporta você até onde cair');
    if (wp.beam) a.push('hiper raio do Pokémon até o alvo');
    if (wp.pull) a.push('puxa e agrupa quem está perto');
    if (wp.protect) a.push('barreira por ' + wp.protect + ' turnos');
    if (wp.quake) a.push('abala o solo todo');
    if (wp.build) a.push('ergue terreno');
    if (wp.chain) a.push('arco elétrico');
    if (wp.drain) a.push('rouba PV');
    if (wp.crit) a.push('crítico ' + Math.round(wp.crit * 100) + '%');
    if (wp.st) a.push({ burn: 'queima', poison: 'envenena', freeze: 'congela', sleep: 'põe p/ dormir', para: 'paralisa' }[wp.st.type] + ' ' + Math.round(wp.st.p * 100) + '%');
    if (wp.web) a.push('prende na teia');
    if (wp.push) a.push('empurra');
    if (wp.count > 1) a.push(wp.count + ' projéteis');
    return a.join(' · ');
  };

  MS.STAGES = [
    { name: 'Rota 1',               theme: 'campo',    enemies: ['rattata', 'pidgey'],               err: 12,  hpMult: 1.0,  wind: 2, guests: [{ sp: 'pikachu', rarity: 0.2 }, { sp: 'jigglypuff', rarity: 0.24 }, { sp: 'machop', rarity: 0.06 }],
      weather: [{ type: 'sun', p: 0.3 }, { type: 'rain', p: 0.25 }, { type: 'storm', p: 0.15 }] },
    { name: 'Floresta de Viridian', theme: 'floresta', enemies: ['caterpie', 'beedrill', 'pidgey'],  err: 10,  hpMult: 1.0,  wind: 2, guests: [{ sp: 'bulbasaur', rarity: 0.22 }, { sp: 'pikachu', rarity: 0.12 }, { sp: 'scyther', rarity: 0.07 }],
      weather: [{ type: 'rain', p: 0.35 }, { type: 'sun', p: 0.25 }] },
    { name: 'Praia',                theme: 'praia',    enemies: ['magikarp', 'magikarp', 'starmie'], err: 8,   hpMult: 1.0,  wind: 3, guests: [{ sp: 'squirtle', rarity: 0.22 }, { sp: 'pikachu', rarity: 0.1 }, { sp: 'exeggutor', rarity: 0.14 }, { sp: 'seel', rarity: 0.1 }],
      weather: [{ type: 'sun', p: 0.35 }, { type: 'rain', p: 0.25 }, { type: 'storm', p: 0.15 }] },
    { name: 'Caverna',              theme: 'caverna',  enemies: ['zubat', 'dugtrio', 'geodude'],     err: 6,   hpMult: 1.15, wind: 1, guests: [{ sp: 'onix', rarity: 0.35 }, { sp: 'charmander', rarity: 0.12 }, { sp: 'gastly', rarity: 0.08 }] },
    { name: 'Torre Pokémon',        theme: 'noite',    enemies: ['gastly', 'zubat', 'gastly'],       err: 5.5, hpMult: 1.15, wind: 2, guests: [{ sp: 'gengar', rarity: 0.1 }, { sp: 'jigglypuff', rarity: 0.16 }, { sp: 'onix', rarity: 0.08 }],
      weather: [{ type: 'rain', p: 0.25 }, { type: 'storm', p: 0.2 }] },
    { name: 'Usina Abandonada',     theme: 'usina',    enemies: ['magnemite', 'magnemite', 'electabuzz'], err: 5, hpMult: 1.2, wind: 2, guests: [{ sp: 'pikachu', rarity: 0.2 }, { sp: 'magmar', rarity: 0.07 }, { sp: 'dugtrio', rarity: 0.1 }],
      weather: [{ type: 'storm', p: 0.4 }, { type: 'rain', p: 0.15 }, { type: 'sun', p: 0.15 }] },
    { name: 'Cabo Cerúleo',         theme: 'cabo',     enemies: ['seel', 'geodude', 'starmie'],      err: 4.8, hpMult: 1.25, wind: 3, guests: [{ sp: 'lapras', rarity: 0.08 }, { sp: 'seel', rarity: 0.16 }, { sp: 'squirtle', rarity: 0.12 }, { sp: 'magikarp', rarity: 0.14 }],
      weather: [{ type: 'rain', p: 0.35 }, { type: 'sun', p: 0.2 }, { type: 'storm', p: 0.1 }] },
    { name: 'Gruta Gelada',         theme: 'gelo',     enemies: ['seel', 'zubat', 'lapras'],         err: 4.4, hpMult: 1.3,  wind: 2, guests: [{ sp: 'seel', rarity: 0.14 }, { sp: 'snorlax', rarity: 0.07, stayRounds: 6 }, { sp: 'jigglypuff', rarity: 0.14 }],
      weather: [{ type: 'snow', p: 0.65 }] },
    { name: 'Ilha Cinnabar',        theme: 'lava',     enemies: ['growlithe', 'magmar', 'geodude'],  err: 4.2, hpMult: 1.35, wind: 2, guests: [{ sp: 'arcanine', rarity: 0.07 }, { sp: 'charmander', rarity: 0.15 }, { sp: 'onix', rarity: 0.12 }],
      weather: [{ type: 'sun', p: 0.55 }] },
    { name: 'Via Vitória',          theme: 'vitoria',  enemies: ['machop', 'scyther', 'machop'],     err: 4,   hpMult: 1.4,  wind: 3, guests: [{ sp: 'machamp', rarity: 0.09 }, { sp: 'snorlax', rarity: 0.07, stayRounds: 6 }, { sp: 'gengar', rarity: 0.06 }],
      weather: [{ type: 'sun', p: 0.25 }, { type: 'storm', p: 0.2 }, { type: 'rain', p: 0.15 }] },
    { name: 'Covil do Dragão',      theme: 'montanha', enemies: ['dratini'],                         err: 3.5, hpMult: 1.9,  wind: 3, boss: true, weather: [{ type: 'storm', p: 0.35 }, { type: 'rain', p: 0.15 }], guests: [{ sp: 'onix', rarity: 0.2 }, { sp: 'dragonair', rarity: 0.08 }, { sp: 'snorlax', rarity: 0.08, stayRounds: 7 }] }
  ];

  // espécies extras que podem se juntar aos selvagens de cada cenário (além dos fixos da fase)
  const POOL = {
    campo: ['caterpie', 'pidgey', 'rattata', 'metapod'], floresta: ['caterpie', 'metapod', 'beedrill', 'pidgey', 'rattata'], praia: ['magikarp', 'starmie', 'seel'],
    caverna: ['zubat', 'geodude', 'graveler', 'dugtrio', 'machop'], noite: ['gastly', 'zubat', 'golbat'], usina: ['magnemite', 'magneton', 'geodude', 'zubat'],
    cabo: ['seel', 'dewgong', 'starmie', 'geodude', 'magikarp'], gelo: ['seel', 'dewgong', 'zubat', 'golbat', 'lapras'], lava: ['growlithe', 'magmar', 'geodude'],
    vitoria: ['machop', 'scyther', 'geodude', 'golbat'], montanha: []
  };
  MS.STAGES.forEach(st => { st.pool = POOL[st.theme] || []; });

  // ---------- Versão com bichos originais (sem personagens de terceiros) ----------
  // mania: cada um tem um gesto próprio quando está parado (art-originais.js e art-bichos.js)
  Object.assign(MS.SPECIES, {
    brasito:    { name: 'Brasito',    types: ['fire'],             weapon: 'fogo',     maxhp: 100, h: 36, hitY: 12, hitR: 12, catch: 0.6, mouth: [12, -9],  mania: true, orig: true, sh: 200 },
    gotalho:    { name: 'Gotalho',    types: ['water'],            weapon: 'agua',     maxhp: 100, h: 34, hitY: 12, hitR: 12, catch: 0.6, mouth: [13, -9],  mania: true, orig: true, sh: 120 },
    musguinho:  { name: 'Musguinho',  types: ['grass'],            weapon: 'planta',   maxhp: 100, h: 38, hitY: 12, hitR: 11, catch: 0.6, mouth: [9, -12],  mania: true, orig: true, sh: 260 },
    faiscolino: { name: 'Faiscolino', types: ['electric'],         weapon: 'volt',     maxhp: 90,  h: 40, hitY: 12, hitR: 12, catch: 0.6, mouth: [12, -9],  mania: true, orig: true, sh: 300 },
    pedrugo:    { name: 'Pedrugo',    types: ['rock'],             weapon: 'pedra',    maxhp: 115, h: 26, hitY: 9,  hitR: 13, catch: 0.6, mouth: [19, -8],  mania: true, orig: true, sh: 60 },
    ventolina:  { name: 'Ventolina',  types: ['normal', 'flying'], weapon: 'ventania', maxhp: 85,  h: 38, hitY: 15, hitR: 13, catch: 0.6, mouth: [10, -13], mania: true, orig: true, sh: 180 },
    caramelo:   { name: 'Caramelo',   types: ['normal'],             weapon: 'osso',      maxhp: 100, h: 34, hitY: 15, hitR: 12, catch: 0.6, mouth: [16, -14], mania: true, orig: true, sh: 200 },
    pinscher:   { name: 'Pinscher',   types: ['normal', 'fighting'], weapon: 'latido',    maxhp: 80,  h: 40, hitY: 15, hitR: 11, catch: 0.6, mouth: [15, -13], mania: true, orig: true, furia: true, sh: 160 },
    tatubola:   { name: 'Tatu-bola',  types: ['rock'],               weapon: 'rolamento', maxhp: 115, h: 30, hitY: 11, hitR: 12, catch: 0.6, mouth: [20, -13],  mania: true, orig: true, sh: 100 },
    formiga:    { name: 'Formiga',    types: ['bug'],                weapon: 'migalha',   maxhp: 85,  h: 44, hitY: 16, hitR: 11, catch: 0.6, mouth: [17, -12], mania: true, orig: true, sh: 120 },
    galinha:    { name: 'Galinha',    types: ['normal', 'flying'],   weapon: 'ovobomba',  maxhp: 90,  h: 36, hitY: 14, hitR: 12, catch: 0.6, mouth: [18, -21], mania: true, orig: true, sh: 40 },
    barata:     { name: 'Barata',     types: ['bug'],                weapon: 'voobarata', maxhp: 75,  h: 34, hitY: 12, hitR: 11, catch: 0.6, mouth: [16, -11], mania: true, orig: true, tenaz: true, sh: 200 },
    baiacu:     { name: 'Baiacu',     types: ['water', 'poison'],    weapon: 'espinhos',  maxhp: 95,  h: 26, hitY: 12, hitR: 11, catch: 0.6, mouth: [17, -12], mania: true, orig: true, infla: true, sh: 180 },
    camaleao:   { name: 'Camaleão',   types: ['grass'],              weapon: 'lingua',    maxhp: 90,  h: 34, hitY: 12, hitR: 11, catch: 0.6, mouth: [19, -14], mania: true, orig: true, camuflagem: true, sh: 120 },
    pombo:      { name: 'Pombo',      types: ['normal', 'flying'],   weapon: 'paoisca',   maxhp: 85,  h: 32, hitY: 13, hitR: 11, catch: 0.6, mouth: [17, -19], mania: true, orig: true, sh: 260 },
    abelha:     { name: 'Abelha Rainha', types: ['bug', 'flying'],  weapon: 'enxame',    maxhp: 90,  h: 44, hitY: 17, hitR: 12, catch: 0.6, mouth: [16, -22], mania: true, orig: true, escolta: 3, sh: 300 },
    sapo:       { name: 'Sapo Colorido', types: ['poison'],         weapon: 'gosma',     maxhp: 80,  h: 34, hitY: 14, hitR: 11, catch: 0.6, mouth: [17, -13], mania: true, orig: true, sh: 300 },
    picapau:    { name: 'Pica-pau',   types: ['normal', 'flying'],   weapon: 'bicada',    maxhp: 95,  h: 38, hitY: 15, hitR: 11, catch: 0.6, mouth: [24, -20], mania: true, orig: true, sh: 220 },
    gato:       { name: 'Gato Persa', types: ['normal'],             weapon: 'bolapelo',  maxhp: 105, h: 40, hitY: 16, hitR: 13, catch: 0.6, mouth: [16, -17], mania: true, orig: true, engasga: true, sh: 30 },
    pernilongo: { name: 'Pernilongo', types: ['bug', 'flying'],      weapon: 'zumbido',   maxhp: 55,  h: 40, hitY: 22, hitR: 10, catch: 0.6, mouth: [24, -22], mania: true, orig: true, esquiva: true, sh: 120 },
    rolabosta:  { name: 'Rola-bosta', types: ['ground', 'bug'],      weapon: 'bolaterra', maxhp: 100, h: 34, hitY: 12, hitR: 12, catch: 0.6, mouth: [18, -12], mania: true, orig: true, sh: 60 }
  });
  Object.assign(MS.WEAPONS, {
    osso:      { label: 'Osso',            type: 'normal',   style: 'bone',  count: 1, spread: 0, speed: 1.05, grav: 0.95, boom: 34, carve: 14, dmg: 40, windMul: 0.7 },
    latido:    { label: 'Latido',          type: 'fighting', style: 'sound', count: 1, spread: 0, speed: 1.1,  grav: 0.55, boom: 34, carve: 6,  dmg: 30, windMul: 0.8, push: 7 },
    migalha:   { label: 'Migalha Gigante', type: 'bug',      style: 'crumb', count: 1, spread: 0, speed: 0.95, grav: 1.15, boom: 36, carve: 18, dmg: 38, windMul: 0.5 },
    ovobomba:  { label: 'Ovo-bomba',       type: 'normal',   style: 'egg',    count: 1, spread: 0, speed: 1.0,  grav: 1.1,  boom: 42, carve: 22, dmg: 42, bounce: 1 },
    voobarata: { label: 'Voo na Cara',     type: 'bug',      style: 'roach',  count: 1, spread: 0, speed: 1.35, grav: 0.45, boom: 24, carve: 6,  dmg: 32, windMul: 0.6 },
    espinhos:  { label: 'Espinhos',        type: 'poison',   style: 'spike',  count: 3, spread: 7, speed: 1.1,  grav: 0.8,  boom: 18, carve: 4,  dmg: 17, st: { type: 'poison', p: 0.3 } },
    lingua:    { label: 'Língua Puxadora', type: 'grass',    style: 'tongue', count: 1, spread: 0, speed: 1.25, grav: 0.7,  boom: 22, carve: 0,  dmg: 24, pull: 60, pullDist: 16, pullOwner: true },
    paoisca:   { label: 'Pão de Isca',     type: 'normal',   style: 'marker', count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 22, carve: 0,  dmg: 12, marker: true },
    coco:      { label: 'Cocô do Pombo',   type: 'normal',   style: 'poop',   count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 22, carve: 4,  dmg: 10, windMul: 0, st: { type: 'sujo', p: 1 } },
    presente:  { label: 'Presente do Céu', type: 'normal',   style: 'poop',   count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 20, carve: 6,  dmg: 16, split: { n: 4, wk: 'caquinha' } },
    caquinha:  { label: 'Caquinha',        type: 'normal',   style: 'poop',   count: 1, spread: 0, speed: 1.0,  grav: 1.1,  boom: 20, carve: 6,  dmg: 16, size: 0.8 },
    enxame:    { label: 'Enxame',          type: 'bug',      style: 'bee',    count: 3, spread: 9, speed: 1.05, grav: 0.6,  boom: 22, carve: 4,  dmg: 18, windMul: 0.6, homing: 0.05 },
    gosma:     { label: 'Gosma Venenosa',  type: 'poison',   style: 'slime',  count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 34, carve: 8,  dmg: 26, st: { type: 'poison', p: 0.7 } },
    bicada:    { label: 'Bicada Broca',    type: 'normal',   style: 'beak',   count: 1, spread: 0, speed: 1.05, grav: 1.1,  boom: 34, carve: 24, dmg: 40, windMul: 0.3, dig: 50, digR: 10, shake: 6 },
    bolapelo:  { label: 'Bola de Pelo',    type: 'normal',   style: 'hair',   count: 1, spread: 0, speed: 1.0,  grav: 1.1,  boom: 40, carve: 18, dmg: 40, bounce: 2, hair: true },
    zumbido:   { label: 'Zumbido',         type: 'bug',      style: 'sound',  count: 1, spread: 0, speed: 1.0,  grav: 0.5,  boom: 32, carve: 0,  dmg: 9,  windMul: 1.2, buzz: true },
    bolaterra: { label: 'Bola de Terra',   type: 'ground',   style: 'dung',  count: 1, spread: 0, speed: 1.0,  grav: 1.2,  boom: 36, carve: 0,  dmg: 34, windMul: 0.3, build: 20, buildR: 34 }
  });
  // ---------- Dois golpes por bicho (estilo GunBound) ----------
  // golpe 1: fraco e rápido (pouco atraso); golpe 2: o golpe especial da espécie, forte e com mais atraso
  Object.assign(MS.WEAPONS, {
    ossinho:   { label: 'Ossinho',         type: 'normal',   style: 'bone',   count: 1, spread: 0, speed: 1.1,  grav: 0.95, boom: 26, carve: 8,  dmg: 22, windMul: 0.7 },
    rosnado:   { label: 'Latido Triplo',   type: 'fighting', style: 'sound',  count: 3, spread: 4, speed: 1.15, grav: 0.5,  boom: 22, carve: 2,  dmg: 9,  windMul: 0.7, push: 4 },
    puloraiva: { label: 'Pulo Raivoso',    type: 'fighting', style: 'dog',    count: 1, spread: 0, speed: 1.05, grav: 1.0,  boom: 30, carve: 0,  dmg: 40, windMul: 0.4, leap: true, shake: 6 },
    pedrinha:  { label: 'Pedrinha',        type: 'rock',     style: 'rock',   count: 1, spread: 0, speed: 1.05, grav: 1.1,  boom: 24, carve: 8,  dmg: 22, windMul: 0.4, size: 0.7 },
    farelo:    { label: 'Farelo',          type: 'bug',      style: 'crumb',  count: 1, spread: 0, speed: 1.0,  grav: 1.05, boom: 26, carve: 8,  dmg: 21, windMul: 0.6 },
    bolinha:   { label: 'Bolinha de Cocô', type: 'ground',   style: 'dung',   count: 1, spread: 0, speed: 1.0,  grav: 1.15, boom: 26, carve: 0,  dmg: 20, windMul: 0.3, build: 9, buildR: 20 },
    milho:     { label: 'Grão de Milho',   type: 'normal',   style: 'crumb',  count: 2, spread: 5, speed: 1.1,  grav: 1.0,  boom: 18, carve: 4,  dmg: 11, windMul: 0.6 },
    minibarata:{ label: 'Barata Filhote',  type: 'bug',      style: 'roach',  count: 1, spread: 0, speed: 1.3,  grav: 0.5,  boom: 20, carve: 4,  dmg: 20, windMul: 0.6 },
    espinho:   { label: 'Espinho',         type: 'poison',   style: 'spike',  count: 1, spread: 0, speed: 1.15, grav: 0.8,  boom: 16, carve: 3,  dmg: 20, st: { type: 'poison', p: 0.12 } },
    lambida:   { label: 'Lambida',         type: 'grass',    style: 'tongue', count: 1, spread: 0, speed: 1.25, grav: 0.7,  boom: 20, carve: 0,  dmg: 20 },
    farelopao: { label: 'Farelo de Pão',   type: 'normal',   style: 'crumb',  count: 1, spread: 0, speed: 1.0,  grav: 1.0,  boom: 24, carve: 6,  dmg: 20, windMul: 0.6 },
    ferroada:  { label: 'Ferroada',        type: 'bug',      style: 'bee',    count: 1, spread: 0, speed: 1.1,  grav: 0.6,  boom: 18, carve: 3,  dmg: 21, windMul: 0.6, homing: 0.03 },
    cuspe:     { label: 'Cuspe',           type: 'poison',   style: 'slime',  count: 1, spread: 0, speed: 1.05, grav: 1.0,  boom: 24, carve: 4,  dmg: 18, st: { type: 'poison', p: 0.25 } },
    bicadinha: { label: 'Bicadinha',       type: 'normal',   style: 'beak',   count: 1, spread: 0, speed: 1.1,  grav: 1.0,  boom: 24, carve: 10, dmg: 22, windMul: 0.3 },
    picada:    { label: 'Picada',          type: 'bug',      style: 'spike',  count: 1, spread: 0, speed: 1.2,  grav: 0.7,  boom: 22, carve: 3,  dmg: 26, st: { type: 'poison', p: 0.45 } },
    tufo:      { label: 'Tufo de Pelo',    type: 'normal',   style: 'hair',   count: 1, spread: 0, speed: 1.05, grav: 1.0,  boom: 26, carve: 8,  dmg: 22 }
  });
  // [golpe 1 (fraco), golpe 2 (forte)]
  const DUO = { caramelo: ['ossinho', 'osso'], pinscher: ['rosnado', 'puloraiva'], tatubola: ['pedrinha', 'rolamento'], formiga: ['farelo', 'migalha'],
    rolabosta: ['bolinha', 'bolaterra'], galinha: ['milho', 'ovobomba'], barata: ['minibarata', 'voobarata'], baiacu: ['espinho', 'espinhos'],
    camaleao: ['lambida', 'lingua'], pombo: ['farelopao', 'paoisca'], abelha: ['ferroada', 'enxame'], sapo: ['cuspe', 'gosma'],
    picapau: ['bicadinha', 'bicada'], pernilongo: ['zumbido', 'picada'], gato: ['tufo', 'bolapelo'] };
  for (const sp in DUO) {
    const S = MS.SPECIES[sp]; if (!S) continue;
    const [w1, w2] = DUO[sp];
    S.weapon = w1; S.extra = [w2];
    MS.WEAPONS[w1].dl = 470; MS.WEAPONS[w1].tier = 1;       // atraso do golpe fraco
    MS.WEAPONS[w2].dl = 720; MS.WEAPONS[w2].tier = 2;       // atraso do golpe forte
  }
  MS.WEAPONS.paoisca.aiVal = 2.6;     // a IA conta o cocô do pombo que vem depois
  MS.WEAPONS.lingua.aiVal = 1.3;
  MS.ORIG_STARTERS = ['caramelo', 'pinscher', 'tatubola'];
  if (MS.AIM_TIERS) { const base = MS.aimRange, tier = { gato: 'mid', pernilongo: 'wide', abelha: 'wide', pedrugo: 'mid', ventolina: 'wide', musguinho: 'basic', pinscher: 'wide', tatubola: 'mid', rolabosta: 'mid', barata: 'wide', baiacu: 'mid', pombo: 'wide' }; MS.aimRange = sp => (tier[sp] ? MS.AIM_TIERS[tier[sp]] : base(sp)); }
  const G = (sp, rarity) => ({ sp, rarity });
  // ---------- Mundos temáticos: Quintal, Cozinha, Praia e Cidade (3 fases cada; a última é o chefão) ----------
  const T = MS.THEMES;
  T.quintal = {
    sky: ['#3a8ad8', '#9cd4f4', '#eef6dc'], far: ['#b8d4c0', '#dcebd8'], near: ['#8cc08c', '#bfe0b0'], tl: '#f4f0e6', tl2: 'fence',
    dirt: ['#8a5a32', '#62401f', '#3a2412'], s1: '#4a3018', s2: '#2c1a0c', g: ['#3e9a2c', '#9ce05a', '#5cb83a'],
    sea: ['#4a9ad8', '#1e5a8a', '#6ab8f0', '#164a78'], fore: '#245a1c',
    decor: ['vaso', 'regador', 'bola', 'flower', 'bush', 'casinha', 'flower'], sun: { x: 650, y: 90, col: '#fff3c4', glow: 1 },
    clouds: 1, terrain: { base: 292, amp: 0.85 }
  };
  T.cozinha = {     // bancada de madeira na frente de uma parede de azulejos, com armários e janela
    sky: ['#efe4cc', '#f5ecd8', '#fbf6ea'], far: ['#e8dcc0', '#e8dcc0'], near: ['#e0d2b4', '#e0d2b4'], tl: '#7c9c8c', tl2: 'kitchen', win: '#d6ecf8',
    deco: '#cdb894', decoA: 0.9, noHills: true, noTuft: true, tex: 'wood',
    dirt: ['#c8925a', '#a8743e', '#7a5028'], s1: '#b4824c', s2: '#94622e', g: ['#6a4220', '#f0c890', '#8a5a2e'],
    sea: ['#8ac8e0', '#4a8aa8', '#b8e4f4', '#3a7a98'], fore: '#5a3a1e',
    decor: ['pote', 'pratos', 'bule', 'fruteira', 'panela', 'garrafa'], decorN: 6, decorS: [1.35, 1.7], sun: null,
    clouds: 0, terrain: { base: 300, amp: 0.6 }
  };
  T.areia = Object.assign({}, T.praia, { tex: 'sand', decor: ['guardasol', 'balde', 'castelo', 'palm', 'concha', 'concha'] });
  T.rua = {
    sky: ['#3a5a9a', '#9ab0d8', '#f4d8b0'], far: ['#8c9ab8', '#b4bed4'], near: ['#6e7a96', '#9aa4bc'], tl: '#56607a', tl2: 'city', tex: 'blocks',
    dirt: ['#8a8a90', '#5e5e66', '#34343a'], s1: '#4a4a52', s2: '#2a2a30', g: ['#6a6a72', '#c8ccd4', '#8a8a92'],
    sea: ['#4a7a6a', '#24443a', '#6a9a88', '#1a382e'], fore: '#2a2a32',
    decor: ['poste', 'lixeira', 'hidrante', 'cone', 'banco', 'lixeira'], sun: { x: 140, y: 200, col: '#ffd8a0', glow: 1 },
    clouds: 0.7, terrain: { base: 296, amp: 0.8 }
  };
  // decoração que solta lasca cinza/colorida ao ser destruída (em vez de folhas)
  MS.DECOR_HARD = { vaso: '#c8643a', regador: '#4aa0d8', bola: '#ff5a4a', casinha: '#c84a3a', xicara: '#ffffff', panela: '#8a8f9a', garrafa: '#7ad0a0', maca: '#e8322a', queijo: '#ffd23a', pote: '#e8d8b8', pratos: '#ffffff', bule: '#5aa0c8', fruteira: '#ffb030',
    guardasol: '#ff6a5a', balde: '#ffc83a', castelo: '#ead59c', concha: '#ffd0c0', poste: '#5a5f6a', lixeira: '#4a8a5a', hidrante: '#e8322a', cone: '#ff8a2a', banco: '#a8743a' };

  const ORIG_STAGES = [
    { world: 'Quintal', name: 'Gramado',            theme: 'quintal', enemies: ['formiga', 'galinha'],               err: 12,  hpMult: 1.0,  wind: 2, guests: [G('pombo', 0.2), G('abelha', 0.12)], weather: [{ type: 'sun', p: 0.35 }, { type: 'rain', p: 0.2 }] },
    { world: 'Quintal', name: 'Horta',              theme: 'quintal', enemies: ['sapo', 'camaleao', 'abelha'],       err: 10,  hpMult: 1.0,  wind: 2, guests: [G('rolabosta', 0.15), G('caramelo', 0.1)], weather: [{ type: 'rain', p: 0.35 }, { type: 'sun', p: 0.25 }] },
    { world: 'Quintal', name: 'Casinha do Cachorro', theme: 'quintal', enemies: ['pinscher', 'caramelo', 'rolabosta'], err: 8,  hpMult: 1.1,  wind: 2, boss: true, guests: [G('formiga', 0.15)] },
    { world: 'Cozinha', name: 'Pia',                theme: 'cozinha', enemies: ['barata', 'pernilongo', 'baiacu'],   err: 7,   hpMult: 1.1,  wind: 1, guests: [G('formiga', 0.15)] },
    { world: 'Cozinha', name: 'Bancada',            theme: 'cozinha', enemies: ['formiga', 'barata', 'galinha'],     err: 6,   hpMult: 1.15, wind: 1, guests: [G('pernilongo', 0.15)] },
    { world: 'Cozinha', name: 'Fogão',              theme: 'cozinha', enemies: ['camaleao', 'baiacu', 'barata'],     err: 5.5, hpMult: 1.2,  wind: 1, boss: true, guests: [G('barata', 0.12)], weather: [{ type: 'sun', p: 0.6 }] },
    { world: 'Praia',   name: 'Areia Quente',       theme: 'areia',   enemies: ['baiacu', 'pernilongo', 'pombo'],    err: 5,   hpMult: 1.2,  wind: 3, guests: [G('galinha', 0.12)], weather: [{ type: 'sun', p: 0.5 }] },
    { world: 'Praia',   name: 'Píer',               theme: 'areia',   enemies: ['galinha', 'picapau', 'baiacu'],     err: 4.8, hpMult: 1.25, wind: 3, guests: [G('tatubola', 0.12)], weather: [{ type: 'rain', p: 0.3 }, { type: 'storm', p: 0.15 }] },
    { world: 'Praia',   name: 'Quiosque',           theme: 'areia',   enemies: ['pombo', 'pinscher', 'tatubola'],    err: 4.6, hpMult: 1.3,  wind: 3, boss: true, guests: [G('pernilongo', 0.15)], weather: [{ type: 'sun', p: 0.35 }] },
    { world: 'Cidade',  name: 'Praça',              theme: 'rua',     enemies: ['pombo', 'pombo', 'caramelo'],       err: 4.4, hpMult: 1.35, wind: 2, guests: [G('gato', 0.12)], weather: [{ type: 'rain', p: 0.2 }] },
    { world: 'Cidade',  name: 'Beco do Lixo',       theme: 'rua',     enemies: ['barata', 'gato', 'pernilongo'],     err: 4.2, hpMult: 1.4,  wind: 2, guests: [G('pombo', 0.15)], weather: [{ type: 'rain', p: 0.3 }, { type: 'storm', p: 0.2 }] },
    { world: 'Cidade',  name: 'Telhado',            theme: 'rua',     enemies: ['gato', 'pombo'],                    err: 3.5, hpMult: 1.9,  wind: 4, boss: true, guests: [], weather: [{ type: 'storm', p: 0.3 }, { type: 'rain', p: 0.15 }] }
  ];
  const ORIG_POOL = { quintal: ['formiga', 'galinha', 'pombo', 'abelha', 'sapo', 'rolabosta'], cozinha: ['barata', 'formiga', 'pernilongo'], areia: ['baiacu', 'pombo', 'pernilongo', 'galinha'], rua: ['pombo', 'barata', 'gato', 'pernilongo'] };
  ORIG_STAGES.forEach(st => { st.pool = ORIG_POOL[st.theme] || []; });
  if (!MS.KEEP_POKEMON) { MS.STAGES.length = 0; MS.STAGES.push(...ORIG_STAGES); MS.ORIGINAIS = true; }   // KEEP_POKEMON: testes da versão antiga
})();
