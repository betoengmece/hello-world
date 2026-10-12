// Dados do jogo: tipos, ataques, espécies, cenários e fases da campanha
(() => {
  const MS = window.MS = window.MS || {};

  // ---------- Tipos ----------
  MS.TYPE_COLOR = {
    normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030',
    bug: '#a8b820', flying: '#a890f0', psychic: '#f85888', dragon: '#7038f8', rock: '#b8a038', ground: '#e0c068'
  };
  MS.TYPE_NAME = {
    normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico',
    bug: 'Inseto', flying: 'Voador', psychic: 'Psíquico', dragon: 'Dragão', rock: 'Pedra', ground: 'Terra'
  };

  // Efetividade: tipo do ataque -> tipo do defensor. 2 = super efetivo, 0.5 = pouco efetivo.
  const CHART = {
    fire:     { grass: 2, bug: 2, water: .5, fire: .5, dragon: .5, rock: .5 },
    water:    { fire: 2, ground: 2, rock: 2, water: .5, grass: .5, dragon: .5 },
    grass:    { water: 2, ground: 2, rock: 2, fire: .5, grass: .5, bug: .5, flying: .5, dragon: .5 },
    electric: { water: 2, flying: 2, grass: .5, electric: .5, dragon: .5, ground: .5 },
    bug:      { grass: 2, psychic: 2, fire: .5, flying: .5 },
    flying:   { grass: 2, bug: 2, electric: .5 },
    psychic:  { psychic: .5 },
    dragon:   { dragon: 2 },
    rock:     { fire: 2, flying: 2, bug: 2, ground: .5 },
    ground:   { fire: 2, electric: 2, rock: 2, grass: .5, bug: .5, flying: .5 },
    normal:   { rock: .5 }
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
    splash:    { label: 'Splash', none: true },
    ball:      { label: 'Pokébola',        type: 'normal',   style: 'ball',    count: 1, spread: 0, speed: 1.0,  grav: 1.0, boom: 0,  carve: 0,  dmg: 0 }
  };

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
    caterpie:   { name: 'Caterpie',   types: ['bug'],               weapon: 'teia',      maxhp: 60,  h: 32, hitY: 8,  hitR: 11, catch: 1.1,  mouth: [15, -8], evo: 'butterfree', evoXp: 130 },
    starmie:    { name: 'Starmie',    types: ['water', 'psychic'],  weapon: 'hidro',     maxhp: 90,  h: 46, hitY: 22, hitR: 15, catch: 0.55, mouth: [14, -26] },
    magikarp:   { name: 'Magikarp',   types: ['water'],             weapon: 'splash',    maxhp: 50,  h: 38, hitY: 11, hitR: 13, catch: 1.25, mouth: [14, -9], evo: 'gyarados', evoXp: 120 },
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
    onix:       { name: 'Onix',       types: ['rock', 'ground'],    weapon: 'pedra',      maxhp: 170, h: 70, hitY: 30, hitR: 19, catch: 0.3,  mouth: [18, -48] }
  };

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
    }
  };

  // ---------- Fases da campanha ----------
  // err: erro de mira do inimigo em graus (menor = mais preciso); wind: vento máximo
  MS.STAGES = [
    { name: 'Rota 1',               theme: 'campo',    enemies: ['rattata', 'pidgey'],              err: 12,  hpMult: 1.0,  wind: 2, guests: [{ sp: 'pikachu', rarity: 0.2 }] },
    { name: 'Floresta de Viridian', theme: 'floresta', enemies: ['caterpie', 'caterpie', 'pidgey'], err: 10,  hpMult: 1.0,  wind: 2, guests: [{ sp: 'bulbasaur', rarity: 0.22 }, { sp: 'pikachu', rarity: 0.12 }] },
    { name: 'Praia',                theme: 'praia',    enemies: ['magikarp', 'magikarp', 'starmie'], err: 8,  hpMult: 1.0,  wind: 3, guests: [{ sp: 'squirtle', rarity: 0.22 }, { sp: 'pikachu', rarity: 0.1 }] },
    { name: 'Caverna',              theme: 'caverna',  enemies: ['rattata', 'pidgey', 'starmie'],   err: 6,   hpMult: 1.15, wind: 1, guests: [{ sp: 'onix', rarity: 0.35 }, { sp: 'charmander', rarity: 0.12 }] },
    { name: 'Covil do Dragão',      theme: 'montanha', enemies: ['dratini'],                        err: 3.5, hpMult: 1.2,  wind: 3, boss: true, guests: [{ sp: 'onix', rarity: 0.2 }, { sp: 'dragonair', rarity: 0.08 }] }
  ];
})();
