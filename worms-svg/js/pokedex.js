(() => {
  const { Art, SPECIES, TYPE_NAME, WEAPONS } = window.MS;
  const descriptions = {
    charmander: 'A chama na ponta da cauda ilumina a silhueta deste pequeno lagarto.',
    bulbasaur: 'Um bulbo verde brota das costas. As manchas escuras ajudam a distinguir a pele das folhas.',
    squirtle: 'O casco marrom protege o corpo azul. A cauda em espiral aparece por trás do casco.',
    pikachu: 'As bochechas vermelhas e a cauda em forma de raio acompanham suas descargas elétricas.',
    rattata: 'Um roedor de pelo roxo, dentes grandes e cauda comprida.',
    pidgey: 'Uma ave pequena de plumagem marrom que levanta ventanias com as asas.',
    caterpie: 'O corpo verde segmentado e a antena vermelha marcam esta pequena lagarta.',
    starmie: 'Duas estrelas sobrepostas giram ao redor de uma joia vermelha.',
    magikarp: 'As barbatanas e a crista dourada balançam a cada salto. No jogo, pode evoluir para Gyarados.',
    dratini: 'Um dragão pequeno de corpo serpenteante e nadadeiras claras ao lado da cabeça.',
    charmeleon: 'Tem uma crista na nuca, garras mais visíveis e uma chama intensa na cauda.',
    ivysaur: 'As folhas abertas nas costas sustentam um botão de flor rosado.',
    wartortle: 'As orelhas e a cauda felpudas se destacam ao redor do casco.',
    raticate: 'Os incisivos enormes ficam à frente do focinho. No jogo, usa a Hiperpresa.',
    pidgeotto: 'Uma ave de crista longa que agita as asas para levantar furacões.',
    butterfree: 'Asas claras com contornos escuros emolduram o corpo e os grandes olhos vermelhos.',
    gyarados: 'Um dragão aquático de corpo azul segmentado, crista alta e longos bigodes.',
    dragonair: 'O corpo esguio ondula, com pequenas asas na cabeça e pérolas azuis ao longo da silhueta.',
    onix: 'Uma cadeia de pedras forma o corpo. No jogo, ele pode cavar pelo terreno.',
    beedrill: 'Ferrões nos braços e asas finas destacam este Pokémon de listras amarelas e escuras.',
    jigglypuff: 'Os olhos azulados e a mecha enrolada dominam o rosto redondo. Seu golpe é o Canto.',
    dugtrio: 'Três cabeças com narizes rosados surgem juntas de um monte de terra.',
    exeggutor: 'Três rostos aparecem entre as folhas largas e o tronco da palmeira.',
    snorlax: 'Um gigante de barriga clara, orelhas pontudas e expressão sonolenta.',
    geodude: 'Uma rocha com dois braços fortes, pronta para arremessar pedras.',
    zubat: 'Orelhas grandes e asas membranosas emolduram o rosto sem olhos.',
    golbat: 'A boca aberta e as presas ocupam boa parte da silhueta deste morcego.',
    gastly: 'Uma névoa roxa flutua ao redor do rosto escuro.',
    gengar: 'O sorriso largo e as pontas nas costas dão forma a este fantasma roxo.',
    machop: 'Um lutador compacto de pele cinza-azulada, três cristas na cabeça e uma cauda curta. Fecha os punhos para atacar.',
    machamp: 'Quatro braços dão a este lutador uma silhueta larga e uma guarda alta.',
    growlithe: 'Pelo alaranjado, listras escuras e uma juba clara lembram um cão tigrado.',
    arcanine: 'A juba volumosa e a cauda espessa contornam o corpo de pelagem listrada.',
    seel: 'Uma foca de corpo claro com um pequeno chifre e nadadeiras arredondadas.',
    lapras: 'O pescoço longo se ergue acima do casco com saliências.',
    magnemite: 'Um olho central, parafusos e dois ímãs compõem seu corpo metálico flutuante.',
    electabuzz: 'Listras negras cortam o corpo amarelo. Seu golpe principal é o Soco Trovão.',
    magmar: 'O focinho lembra um bico, e formas de chama se destacam na cabeça.',
    scyther: 'Duas lâminas curvas fazem as vezes de antebraços. As asas ficam recolhidas atrás do corpo.',
    metapod: 'Um casulo verde de formato angular. No jogo, evolui para Butterfree.',
    graveler: 'Braços rochosos se projetam de um corpo irregular e facetado.',
    magneton: 'Três corpos metálicos se juntam em um conjunto cercado por ímãs.',
    dewgong: 'O corpo branco e alongado termina em uma cauda bifurcada.',
  };

  const dialog = document.getElementById('pokedex');
  const search = dialog.querySelector('input');
  const list = dialog.querySelector('.dex-list');
  const count = dialog.querySelector('.dex-count');
  const entry = dialog.querySelector('.dex-entry');
  const empty = dialog.querySelector('.dex-empty');
  const title = dialog.querySelector('.dex-name');
  const types = dialog.querySelector('.dex-types');
  const description = dialog.querySelector('.dex-description');
  const stats = dialog.querySelector('.dex-stats');
  const picture = dialog.querySelector('.dex-picture');
  const sprite = picture.querySelector('g');
  const svgLink = dialog.querySelector('.dex-svg');
  const entries = Object.entries(SPECIES).sort(([, a], [, b]) => a.name.localeCompare(b.name, 'pt-BR'));
  let selected = 'machop';
  let visible = [];
  let svgUrl;

  function clearSvg() {
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    svgUrl = undefined;
    svgLink.removeAttribute('href');
  }

  function showEntry(id) {
    selected = id;
    const species = SPECIES[id];
    const label = species.types.map(type => TYPE_NAME[type]).join(' · ');
    title.textContent = species.name;
    types.textContent = label;
    description.textContent = descriptions[id] || `Pokémon do tipo ${label.toLowerCase()}.`;
    stats.textContent = `${species.maxhp} PV · ${WEAPONS[species.weapon].label}`;
    entry.hidden = false;
    empty.hidden = true;
    picture.setAttribute('aria-label', `Sprite de ${species.name}`);
    sprite.innerHTML = Art.draw(id, { f: 30, blink: false, bob: 0, step: 0, breath: 0, x: 0 });
    const { x, y, width, height } = sprite.getBBox();
    const size = Math.max(width, height) * 1.23;
    const viewBox = `${x + (width - size) / 2} ${y + (height - size) / 2} ${size} ${size}`;
    picture.setAttribute('viewBox', viewBox);

    // O arquivo aberto fora do jogo precisa levar os gradientes que o sprite usa.
    const paints = new Set(Array.from(sprite.innerHTML.matchAll(/url\(#([\w-]+)\)/g), match => match[1]));
    const defs = Array.from(paints, key => document.getElementById(key)?.outerHTML || '').join('');
    const standalone = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="640" height="640"><title>${species.name}</title><defs>${defs}</defs>${sprite.innerHTML}</svg>`;
    clearSvg();
    svgUrl = URL.createObjectURL(new Blob([standalone], { type: 'image/svg+xml' }));
    svgLink.href = svgUrl;

    for (const button of list.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.species === id));
    }
  }

  function filterEntries() {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    visible = entries.filter(([, species]) => species.name.toLocaleLowerCase('pt-BR').includes(query));
    count.textContent = `${visible.length} de ${entries.length} Pokémon`;
    list.replaceChildren(...visible.map(([id, species]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = species.name;
      button.dataset.species = id;
      return button;
    }));
    const next = visible.find(([id]) => id === selected) || visible[0];
    if (next) showEntry(next[0]);
    else {
      entry.hidden = true;
      empty.hidden = false;
      clearSvg();
    }
    list.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  search.addEventListener('input', filterEntries);
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-species]');
    if (button) showEntry(button.dataset.species);
  });
  dialog.addEventListener('close', clearSvg);
  window.MS.Pokedex = {
    get open() { return dialog.open; },
    show() {
      dialog.showModal();
      filterEntries();
    },
    gamepad(key) {
      if (key === 'Escape' || key === 'o') {
        dialog.close();
        return;
      }
      const step = key === 'ArrowUp' || key === 'ArrowLeft' ? -1
        : key === 'ArrowDown' || key === 'ArrowRight' ? 1 : 0;
      if (!step || !visible.length) return;
      const index = visible.findIndex(([id]) => id === selected);
      showEntry(visible[(index + step + visible.length) % visible.length][0]);
      list.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
    },
  };
})();
