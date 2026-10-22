# Monstrinhos de Artilharia — versão com monstrinhos originais (ramo `originais`)

Esta versão troca os personagens de terceiros por bichos caricatos próprios e a captura por Pokébola pelo **Ovo de Laço**.

- **Bichos (js/art-bichos.js):** **Caramelo** (vira-lata, Normal, joga um osso; mania: pulinhos de alegria com a língua de fora), **Pinscher** (Normal/Lutador, latido sônico; treme sem parar, late até dar um passo para trás e com menos de 40% de vida entra em fúria: +50% de dano), **Tatu-bola** (Pedra, rolamento que quica; vira bola, espia com um olhinho e desenrola), **Formiga** (Inseto, migalha gigante; bate as pinças) e **Rola-bosta** (Terra/Inseto, bola de terra que quica; a bola rola de volta e ele corre atrás). Parceiros iniciais: Caramelo, Pinscher e Tatu-bola.
- **Segunda leva (js/art-bichos2.js):** **Galinha** (ovo-bomba que quica; bica o chão sem parar), **Barata** (voa na cara; sobrevive uma vez por fase com 1 de vida), **Baiacu** (espinhos venenosos; quando apanha infla, fica maior e passa a levar metade do dano até a vez dele), **Camaleão** (língua que puxa o inimigo um pouco para perto, sem derrubar da beirada; depois de atacar fica camuflado e a CPU não mira nele; muda de cor e cada olho gira para um lado), **Pombo** (joga um pão de isca; outro pombo vem voando e solta o cocô em cima do bicho mais perto do pão, que fica **sujo**: perde 4 de vida por turno durante 3 turnos; anda balançando a cabeça) **Sapo Colorido** (sapo-ponta-de-flecha: gosma venenosa que envenena fácil; enche o papo e coaxa), **Pica-pau** (bicada broca que abre túnel como o Cavar; bica sem parar) **Pernilongo** (bem fraco, 55 de vida; quando um tiro chega perto ele sai voando para um lado sorteado, nunca para fora da beirada, então tem que mirar onde ele vai fugir; o Zumbido tira pouco e faz um barulho chato) e **Abelha Rainha** (coroa dourada e 3 abelhinhas voando em volta; o Enxame manda as três atrás do alvo; mania: a dança do oito).
- **Gato Persa (js/art-bichos3.js):** bolota de pelo com cara amassada e entediada. Antes de atacar ele **engasga** (trancos, pescoço esticado, olhos espremidos, "hck… hck… blé") e cospe a **Bola de Pelo**, que quica duas vezes. A mania dele é o mesmo engasgo.
- **Filhotes (js/art-filhotes.js):** cada bicho tem versão bebê própria (caramelo filhote, pinscher de orelhas gigantes, tatuzinho rosado, larvinha de formiga, besourinho com bolinha de cocô, pintinho com casca na cabeça, ninfa branca de barata, baiacuzinho, camaleãozinho de rabo enrolado, pombinho careca, abelha princesinha, girino com perninhas, pica-pauzinho de bicão, pernilonguinho e gatinho persa). O filhote do ovo usa essa arte e, ao vencer a fase, cresce e vira adulto no meio da animação.
- **Mundos temáticos (js/art-mundos.js):** 12 fases em 4 mundos de 3 — **Quintal** (cerca branca, vasos, regador, bola, casinha do cachorro), **Cozinha** (bancada de madeira com veio e nós, parede de azulejo tijolinho, armários com puxador, janela e potes ao fundo; objetos grandes: pote de biscoitos, pilha de pratos, bule, fruteira, panela, garrafa; a última fase é o Fogão), **Praia** (guarda-sol, balde, castelo de areia, conchas) e **Cidade** (prédios, poste, lixeira, hidrante, cone, banco). A última fase de cada mundo tem um **chefão** maior (Pinscher, Camaleão, Pombo e o Gato Persa no Telhado). A tela de fases mostra uma linha por mundo.
- **Dois golpes por bicho (estilo GunBound):** golpe 1 fraco e rápido (pouco atraso) e golpe 2, o especial da espécie, forte e com mais atraso. Troca com G ou o botão GOLPE. A CPU escolhe pelo dano esperado dividido pelo atraso.
- **Itens (tecla I ou botão ITEM, antes do tiro):** por fase o seu time tem **Tiro Duplo ×2** (dois tiros seguidos com a mesma mira; custa os dois atrasos + 220, mais caro que dois tiros separados), **Força+ ×1** (+30% de dano, +180 de atraso) e **Cura ×1** (+35 de vida, +260 de atraso). Os selvagens têm Tiro Duplo ×1 e Cura ×1 e usam sozinhos.
- **Sensação de impacto:** pausa curtinha no acerto (mais longa quanto maior o dano), o bicho achata e estica como mola e é empurrado um pouco (nunca para fora da beirada), número de dano grande que "estoura", palavra de quadrinho nos golpes fortes (POW!, TUM!, CABUM!…), poeira subindo do chão e tremor maior nos golpes fortes. Texturas próprias de terreno: madeira (Cozinha), areia (Praia) e blocos de concreto (Cidade).
- **Nocaute:** o bicho cai de lado com olhos em X, estrelinhas girando na cabeça e some numa nuvem.
- **Vitória:** confete, o time pula de alegria e a fase dá de 1 a 3 estrelas (3: ninguém desmaiou e o time terminou com metade da vida ou mais; 2: ninguém desmaiou; 1: venceu). As estrelas aparecem no painel e na tela de fases.
- **Pinscher (22/10):** golpe 1 **Latido Triplo** (3 ondas em leque que empurram); golpe 2 **Pulo Raivoso** — ele mesmo é lançado, morde forte (40) onde cair e fica ali do lado do alvo; se cair no vazio ou na água, volta correndo para onde estava (nunca se mata).
- **Rola-bosta (22/10):** a Bola de Terra e a Bolinha não quicam nem cavam: onde batem viram um **montinho de cocô** (marrom-escuro com caroços e sementinhas) que passa a fazer parte do chão e acumula a cada tiro. Do monte sobe **cheiro** (fiapos verdes) e voam **moscas** (mais monte, mais moscas). Quem terminar o turno perto do monte leva picada das moscas: dano baixo que cresce com o tamanho do monte (≈1 a cada 9 de altura). O rola-bosta não é picado. Explosões vão gastando o monte.
- Os seis primeiros monstrinhos (Brasito, Gotalho, Musguinho, Faiscolino, Pedrugo e Ventolina, em `js/art-originais.js`) continuam no código, mas fora das fases.
- **Início:** em vez da cidade das Pokébolas, você escolhe o parceiro (Brasito, Gotalho ou Musguinho).
- **Ovo de Laço:** um selvagem derrotado sem exagero no dano (sobra de dano até 35% da vida dele) solta um ovo; com golpe forte demais a chance cai para 30%. O ovo rola pelo terreno e pode cair na água ou quebrar numa explosão. Na sua vez, aperte **B** (ou o botão **REDE**) e lance a rede: se acertar o ovo, a rede fecha, o ovo voa até quem lançou e fica com ele. Depois de um turno o ovo choca e o filhote entra na batalha do seu lado, com metade do tamanho, da vida e da força. Ao vencer a fase a captura vale: os filhotes crescem até o tamanho normal e entram no time. Se o último selvagem deixar um ovo, você ganha uma vez extra só para lançar a rede.
- As fases usam só os monstrinhos originais. Sem Pokébolas no campo e sem o botão BOLA.

**Tiro em dois toques:** o primeiro toque (ESPAÇO, X no controle ou TIRO) começa a barra de força, que sobe até o máximo e volta; o segundo toque atira. Se a barra zerar sem o segundo toque, o tiro é cancelado e dá para tentar de novo.

O resto do jogo (WebGL, terreno por shader, câmera, controles) é igual ao ramo principal.

---

# Monstrinhos de Artilharia

Jogo de artilharia por turnos feito inteiramente com SVG. Personagens, terreno destrutível, mira, projéteis e menus são elementos `<svg>`; o JavaScript só cuida da lógica. Sem dependências: abra o `index.html` no navegador.

> Projeto de fã, sem fins lucrativos. Pokémon e os nomes das criaturas pertencem a Nintendo / Game Freak / Creatures. Todas as artes aqui são desenhos próprios em SVG.

## Modos

### Campanha
1. **Fase inicial (cidade):** você é o treinador e tem **5 Pokébolas**. Acerte uma em quem quiser como parceiro.
   Os 3 iniciais (Charmander no terraço, Bulbasaur atrás do muro, Squirtle na lagoa) são difíceis de acertar; Pidgey, Rattata e Caterpie são fáceis. Quem a bola acertar primeiro vira o seu parceiro (se as bolas acabarem, um dos fracos decide te acompanhar).
2. **11 fases** em cenários diferentes: Rota 1, Floresta de Viridian, Praia, Caverna, Torre Pokémon (noite, Fantasma), Usina Abandonada, Cabo Cerúleo, Gruta Gelada (neve), Ilha Cinnabar (lava), Via Vitória (Lutador) e o Covil do Dragão (chefe).
   **Escolher fase:** no menu, "Escolher fase" lista as fases já liberadas. Tocar (ou passar o mouse) numa fase mostra os selvagens, visitantes e climas dela; o botão **Jogar** entra na fase (no teclado, ENTER). Serve para voltar e capturar o que ficou para trás. Seus Pokémon, XP e progresso são mantidos; rejogar uma fase antiga não reduz o progresso e não acumula bolas (só garante um mínimo de 4).
3. Cada fase é uma batalha por turnos, no mesmo estilo de tiro: você contra os Pokémon selvagens, que mirem sozinhos (a IA calcula o tiro e erra menos a cada fase).
4. **Captura:** quando um inimigo fica fraco (≤ 35% de PV) aparece uma Pokébola sobre ele. Aperte **B** (ou o botão **BOLA**), mire e arremesse. Se acertar um inimigo fraco, a chance de captura depende da espécie e de quão machucado ele está (aparece em % quando a bola está ativa). Acertar um inimigo ainda forte desperdiça a bola.
5. **Itens no campo:** cada fase tem Pokébolas espalhadas pelo chão. Ande até elas para pegar: Pokébola comum (+1), **Great Ball** (chance de captura ×1,5) e **Ultra Ball** (×2,3). As bolas melhores ficam guardadas entre as fases. Se o seu último tiro foi uma Pokébola, a próxima vez já começa com ela pronta (até você dar um tiro normal). Com a bola ativa, **B** de novo troca para a Great/Ultra e depois guarda.
6. **Clima:** nos cenários ao ar livre cada fase pode ter clima sorteado (a Caverna nunca tem): **Chuva** (golpes de Água +50%), **Sol forte** (Fogo e Planta +40%), **Tempestade** com relâmpagos e sem chuva (Elétrico +50%) e **Neve** (Gelo +50%). **O clima muda sozinho no meio da fase** (a cada 3 a 6 rodadas, com aviso na tela e transição suave). Vale para os dois lados e aparece num selo no topo. O chefe do Covil do Dragão tem bem mais PV que um Dratini comum.
7. **Evolução:** ao vencer uma fase, quem lutou ganha XP (mais se causou dano). Ao encher a barra (aparece na tela de escolha do time) o Pokémon evolui, com uma cena de evolução: Charmander → Charmeleon, Bulbasaur → Ivysaur, Squirtle → Wartortle, Rattata → Raticate, Pidgey → Pidgeotto, Caterpie → Metapod → Butterfree, Geodude → Graveler, Magnemite → Magneton, Seel → Dewgong, Magikarp → Gyarados, Dratini → Dragonair, Zubat → Golbat, Gastly → Gengar, Machop → Machamp, Growlithe → Arcanine. Gyarados e as evoluções são bem mais fortes.
   **Como upar o Magikarp:** ele ganha XP só por participar do time na fase (não precisa causar dano; e ganha 50% a mais de XP). Leve-o nas fases e, ao vencer, ele evolui para Gyarados (a barra de XP aparece na tela de escolha do time). Dá para rejogar uma fase pelo menu para treinar.
8. **Visitantes neutros:** em cada fase um Pokémon neutro pode aparecer no meio do campo ("VISITANTE"), ficar por 2 a 4 rodadas atacando um lado sorteado (avisa antes qual), e depois ir embora e voltar mais tarde, ou não. Cada cenário tem os seus, com raridades diferentes (na Caverna, o Onix é o mais comum). Dá para derrubá-lo ou, melhor, enfraquecer e capturar com a Pokébola.
9. Seus Pokémon se curam entre as fases. Quando seu time passa de 3, você escolhe quais 3 levar. O progresso é salvo no navegador ao concluir cada fase.
10. **Novos encontros:** Jigglypuff pode visitar a Rota 1; Beedrill é um inimigo da Floresta de Viridian; Exeggutor pode visitar a Praia; Dugtrio é um inimigo da Caverna; Snorlax é um visitante raro do Covil do Dragão, permanecendo por 7 rodadas para dar mais tempo de captura. Dratini continua sendo o chefe final.

11. **Golpes variantes (★):** cada indivíduo tem o seu conjunto de golpes. Além do golpe padrão da espécie, existem variantes (por exemplo um Pikachu com **Trovão**, mais forte, ou **Descarga Ampla**, mais área; Machop com **Mil Socos**, vários tiros, etc.). Indivíduos variantes aparecem com **★** ao lado do nome; os raros (**★★**) têm **os dois golpes** e você alterna entre eles com **G** (ou o botão **GOLPE**). A captura guarda o golpe do indivíduo, e a tela de escolha do time mostra os golpes de cada um. Nas fases mais avançadas as variantes ficam mais comuns. A IA dos selvagens com dois golpes simula os dois e usa o que promete mais dano.
12. **Novos Pokémon:** Geodude, Zubat/Golbat, Gastly/Gengar, Machop/Machamp, Growlithe/Arcanine, Seel, Lapras, Magnemite, Electabuzz, Magmar e Scyther, com os novos tipos **Fantasma**, **Gelo** e **Lutador**. O Magikarp também pode ter a variante **Batida** (um golpe fraco de verdade).
13. **Mapas que mudam a cada partida:** a largura, o relevo (colinas, planície, vale, ladeira, platôs, pontas), as posições iniciais (lados opostos, trocados ou misturados pelo mapa), os selvagens extras do cenário (além dos fixos da fase), as Pokébolas espalhadas e a decoração mudam toda vez. Dá para ver as espécies extras na tela de escolher fase ("às vezes: ...").
14. **Mapas largos:** alguns mapas têm 1100, 1400 ou 1700 de largura (a tela mostra 800). Aparece um **minimapa** no topo direito com o terreno, os Pokémon, as Pokébolas e a janela da câmera. Para olhar o resto do mapa: **Q / E** (ou arraste na tela, ou toque/arraste no minimapa); **C** volta a seguir o seu Pokémon. A câmera também volta sozinha ao começar o turno. Mapas largos dão um pouco mais de caminhada por turno e os selvagens avançam na sua direção.
15. **Visitantes em qualquer lugar:** o visitante pode aparecer em qualquer ponto do mapa, **se mexe** antes de atacar (anda, ou voa) e mira em quem estiver perto. Os voadores (Pidgey, Pidgeotto, Butterfree, Zubat, Golbat, Scyther, Beedrill) e os flutuantes (Gastly, Magnemite) aparecem **no ar**, pairando acima do terreno.
16. **✨ Shiny:** cada selvagem (inclusive visitantes) tem **1 chance em 1000** de ser shiny, com a cor trocada, brilhinhos e ✨ no nome. Dá para capturar e ele continua shiny (salvo no jogo, mantido ao evoluir).
17. **Golpes com personalidade:** os ataques agora se comportam de forma diferente. Os pesados (**pedra, pedrada, lama, golpe corporal**) quase ignoram o vento, fazem a tela tremer e a pedra é maior; os leves (**folhas, ventania, vento prateado, Onda Sônica**) são levados pelo vento. Efeitos: **queimadura** (Fogo) e **veneno** causam dano por 3 turnos; **congelar** (Gelo), **paralisar** (Elétrico, Lambida) e **dormir** (Canto, Pó do Sono) fazem perder a vez; o raio dá **arco elétrico** que salta para outro alvo; **Avalanche** e **Sementes** se dividem no ar; **Rolamento** quica; **Terremoto** abala o solo inteiro; **Lama** ergue terreno; **Sombra** atravessa o chão; **Psíquico** persegue o alvo; golpes de lutador/investida têm **crítico**; Folha Navalha 2 **rouba PV**. A descrição do golpe aparece no painel do topo.

18. **Batalha no estilo dos mobiles (GunBound):**
    - **Ilhas flutuantes:** as fases agora são ilhas soltas no céu, com vãos entre elas e rocha pendurada por baixo. Quem cai das ilhas vai para a água e está fora.
    - **Terreno destrutível de verdade:** cada explosão abre um buraco redondo, que pode virar cratera funda, túnel ou partir a ilha. Quem está em cima despenca. A grama queima onde o golpe passou.
    - **Andar como os mobiles:** o Pokémon sobe degraus pequenos, para em paredes e tetos de túnel, cai em buracos e **inclina o corpo** com o morro. Dá para andar até a beira e cair (a IA não faz isso). Os Pokémon **atravessam uns aos outros** ao andar, sem travar.
    - **Ordem por atraso:** não é mais um time de cada vez. Joga o Pokémon (de qualquer lado) com menos **atraso** acumulado. Golpes fortes custam mais atraso; andar e demorar também. O painel **ORDEM · ATRASO** (topo esquerdo) mostra quem vem a seguir. O time com menos Pokémon paga menos atraso por ação, para 1 contra 3 continuar justo.
    - **Ângulo e faixa de mira:** o ângulo mostrado é sempre em relação à **horizontal**. Cada espécie tem uma **faixa de mira** (a fatia clara no mostrador), medida a partir do corpo, que **gira com a inclinação do chão**:
      - fracos escolhem quase qualquer ângulo, **180°** (Caterpie, Metapod, Magikarp, Rattata, Pidgey, Zubat, Gastly, Magnemite, Jigglypuff);
      - a maioria tem **0° a 90°**;
      - evoluções intermediárias têm **15° a 75°** (Charmeleon, Ivysaur, Wartortle, Golbat, Graveler, Magneton, Dewgong, Electabuzz, Magmar, Scyther, Exeggutor);
      - os fortes só têm **30°** (30° a 60°: Gyarados, Dragonair, Onix, Snorlax, Gengar, Machamp, Arcanine, Lapras).
      Para conseguir um ângulo fora da faixa, ande até um morro: subindo, a faixa fica mais alta; descendo, mais baixa. Virar para o outro lado espelha a mira.
    - **Vento em qualquer direção:** muda a cada turno, inclusive para cima e para baixo (bússola no topo).
    - **Barra de baixo:** mostrador do ângulo, força com a **marca do último tiro** daquele Pokémon e barra de movimento. Cada turno tem **30 segundos**; se acabar, passa a vez. **P** (ou o botão **PASSAR**) passa a vez de propósito.
    - **Cavar (Onix):** o golpe entra no chão, abre um túnel e explode lá dentro.
19. **Golpes especiais (extra, alterne com G ou GOLPE):** algumas espécies ganharam um golpe a mais, sem perder os que já tinham:
    - **Ataque Subterrâneo** (Dugtrio): ao bater no chão, entra na terra, corre por baixo e estoura **embaixo do inimigo** (dá para ver a poeira subindo por onde ele passa).
    - **Raio do Céu** (Pikachu, Magneton) e **Tempestade** (Electabuzz, 3 raios): o golpe marca o ponto, aparece um aviso piscando e **cai um raio do céu** ali.
    - **Fissura** (Geodude, Graveler, Onix): abre um **buraco enorme** no terreno, mas causa pouco dano. Ótimo para derrubar quem está em cima.
    - **Teleporte** (Starmie, Exeggutor): o Pokémon **aparece onde o golpe cair** (se cair na água, falha).
    - **Hiper Raio** (Gyarados, Dragonair, Snorlax, Pidgeotto): quando o golpe cai, sai um **feixe de luz do Pokémon até o ponto**, atravessando o terreno e acertando todos no caminho. Os voadores (Pidgeotto) **sobem** antes de disparar e depois descem.
    - **Redemoinho** (Pidgey, Butterfree, Golbat): **puxa e agrupa** quem está perto do impacto (pode puxar alguém para dentro de um vão!).
    - **Proteção** (Metapod, Squirtle, Wartortle, Lapras): cria uma **barreira** que dura 2 turnos do Pokémon; enquanto dura, ele leva só 30% do dano. A IA usa quando está machucada.

## Tipos e ataques

Ataques com o tipo certo causam **o dobro de dano** ("Super efetivo!"); com o tipo errado, metade ("Pouco efetivo...").

| Pokémon | Tipo | Ataque |
|---|---|---|
| Charmander | Fogo | Lança-chamas: bola de fogo forte, abre cratera grande |
| Bulbasaur | Planta | Folha Navalha: 3 folhas em leque, leves |
| Squirtle | Água | Jato d'Água: não destrói terreno e empurra |
| Pikachu | Elétrico | Trovoada: raio em ziguezague |
| Rattata | Normal | Investida |
| Pidgey | Normal/Voador | Ventania: duas rajadas que empurram |
| Caterpie | Inseto | Teia: o atingido perde a caminhada no próximo turno |
| Starmie | Água/Psíquico | Psíquico: esfera que persegue o alvo (variante: Hidro Pulso) |
| Magikarp | Água | Splash: não faz nada (mas é fácil de capturar) |
| Dratini | Dragão | Fúria do Dragão (chefe da campanha, pequeno e frágil) |
| Onix | Pedra/Terra | Cavar: entra no chão, abre um túnel e explode lá dentro (variantes: Avalanche, Cavar Veloz) |
| Beedrill | Inseto/Veneno | Ferrão Venenoso: dois ferrões roxos, pouco dano ao terreno |
| Jigglypuff | Normal | Canto: onda sonora leve que põe para dormir (variante: Pancada) |
| Dugtrio | Terra | Bomba de Lama: pesada, ergue terreno (variante: Terremoto) |
| Exeggutor | Planta/Psíquico | Bomba de Sementes: dois projéteis de Planta |
| Snorlax | Normal | Golpe Corporal: ataque forte que empurra o alvo |
| Geodude | Pedra/Terra | Atirar Pedra (variante: Rolamento, que quica) |
| Zubat / Golbat | Veneno/Voador | Onda Sônica (2 rajadas) / Presa Venenosa |
| Gastly / Gengar | Fantasma/Veneno | Lambida / Bola Sombria |
| Machop / Machamp | Lutador | Soco Focado / Golpe de Caratê (2 socos) |
| Growlithe / Arcanine | Fogo | Presa de Fogo / Roda de Fogo (2 bolas) |
| Seel / Lapras | Água/Gelo | Raio Aurora / Nevasca (2 estilhaços) |
| Magnemite | Elétrico | Onda de Choque (2 raios) |
| Electabuzz | Elétrico | Soco Trovão (visual remasterizado) |
| Magmar | Fogo | Brasas (3 brasas) |
| Scyther | Inseto/Voador | Corte Duplo |
| Charmeleon / Ivysaur / Wartortle | Fogo / Planta / Água | versões mais fortes dos ataques iniciais |
| Raticate / Pidgeotto | Normal / Normal+Voador | Hiperpresa / Furacão |
| Butterfree | Inseto/Voador | Vento Prateado: três rajadas (variante: Pó do Sono) |
| Metapod | Inseto | Casca Dura: casca de pedra leve que cai perto (evolui de Caterpie e vira Butterfree) |
| Graveler | Pedra/Terra | Pedra: pedra pesada, ignora o vento (evolução de Geodude) |
| Magneton | Elétrico/Voador | Raio em Corrente: arco elétrico que salta (evolução de Magnemite) |
| Dewgong | Água/Gelo | Gelo Forte: congela, com chance de deixar sem ação (evolução de Seel) |
| Gyarados | Água/Voador | Hidro Bomba |
| Dragonair | Dragão | Cometa Dragão |

Relações usadas: Pedra > Fogo, Voador, Inseto · Terra > Fogo, Elétrico, Pedra, Veneno · Água/Planta > Terra, Pedra · Fogo > Planta, Inseto · Água > Fogo · Planta > Água · Elétrico > Água, Voador · Inseto > Planta, Psíquico · Voador > Planta, Inseto · Dragão > Dragão · Veneno > Planta · Psíquico > Veneno, Lutador. Gelo > Planta, Terra, Voador, Dragão (e Fogo > Gelo, Pedra > Gelo). Lutador > Normal, Pedra, Gelo (fraco contra Voador, Psíquico, Inseto, Veneno). Fantasma > Fantasma, Psíquico (Normal e Lutador quase não o afetam). Veneno é resistido por Veneno, Terra e Pedra; Veneno resiste a Planta e Inseto. O tipo Veneno não aplica dano contínuo. Os multiplicadores dos dois tipos são combinados quando o defensor tem tipo duplo.

## Controles

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Q / E | olhar o mapa à esquerda / direita (mapas largos); C recentraliza |
| Segurar ESPAÇO | carregar força; soltar para atirar |
| B | ativar/cancelar a Pokébola (campanha) |
| G | trocar de golpe (quando o Pokémon tem dois) |
| P | passar a vez (a ordem dos turnos é por atraso) |
| R | reiniciar a fase (pede confirmação) |
| M | liga/desliga o som |
| O (ou botão ⚙) | menu lateral de ajustes: brilho da tela e volume do som (o jogo pausa; ← → ajusta, ↑ ↓ escolhe). Fica salvo no navegador |
| ESC | volta ao menu |

**Controle (DualSense do PS5, Xbox ou genérico, por Bluetooth/USB):** direcional ou analógico esquerdo anda (← →) e mira (↑ ↓); **segure X** para carregar e solte para atirar (nos menus, X confirma); **▢** Pokébola; **△** troca de golpe; **R2** passa a vez; **L2** recentraliza a câmera; **L1/R1** ou analógico direito olham o mapa; **Create** reinicia (pede confirmação); **Options** abre os ajustes; **O** volta/fecha. Ao conectar aparece "Controle conectado!".

**TV / Fire TV:** o jogo se ajusta para caber inteiro na altura da janela. Em ⚙ Ajustes há **Tela cheia** (tecla F) e **Teste do controle** (`controle.html`), uma tela que mostra o que chega do controle e do controle remoto. Com ponteiro (Silk), o **TIRO** pode ser tocado uma vez para começar a carregar e de novo para soltar.

**Controle no Fire TV (Silk):** o Silk prende o X e os direcionais no ponteiro e numera os botões de outro jeito, então lá o jogo usa outro esquema (detectado sozinho): **O** atira (segurar e soltar) e confirma, **L1/R1** andam, **△/▢** miram, **Create** troca de golpe, **Options** ajustes, **L2/R2** Pokébola e passar a vez (se chegarem). Pokébola, passar e reiniciar também ficam nos botões da tela.

**Modo leve (TV, Fire TV, aparelhos fracos):** em ⚙ Ajustes → **Qualidade** (Automática / Alta / Leve). Na automática, se o jogo estiver lento o modo leve liga sozinho e fica lembrado. Ele desenha no máximo a 30 quadros por segundo, tira as camadas decorativas mais pesadas (nuvens, montanhas do fundo, textura e faixa 2.5D do chão, chuva/neve) e anima menos os enfeites. O jogo em si não muda.

**Terreno pela placa de vídeo (WebGL):** o chão não é mais uma imagem: o mapa de buracos vira uma textura de dados e um shader pinta terra, rocha, pedrinhas, grama, capim, queimado e a fatia 2.5D a cada quadro. Numa explosão só as colunas atingidas são reenviadas, então o buraco aparece no mesmo quadro e o terreno fica nítido em qualquer zoom. Explosões, raios e tiros de fogo iluminam o terreno em volta e ganham brilho somado à luz.

**Painel no WebGL:** o painel de cima vira uma imagem refeita só quando algum texto muda; a barra de força, o retângulo do minimapa e as mensagens são desenhados direto pela placa de vídeo.

**IA em segundo plano:** a CPU simula seus tiros num Web Worker, fora da linha que desenha a tela.

**Instalável e sem internet:** no celular, o navegador oferece "Adicionar à tela inicial" (ou ⚙ Ajustes → Instalar o jogo). Depois de aberto uma vez, o jogo funciona sem internet.

**WebGL (padrão):** o mundo (céu, montanhas, terreno, água, Pokémon, tiros, partículas, efeitos e clima) é desenhado num `<canvas>` pela placa de vídeo, em poucos lotes por quadro. Os fundos e o terreno são "fotografados" das camadas SVG no início da fase; numa explosão o buraco aparece na hora e só a área atingida é redesenhada logo depois. As poses dos Pokémon (parado, andando, atacando, piscando) viram imagens guardadas num atlas na primeira vez que aparecem. Painel, menus e botões continuam em SVG por cima. A fase da cidade e aparelhos sem WebGL usam o desenho SVG; em ⚙ Ajustes, **Desenho: WebGL/SVG** troca entre os dois. No WebGL a câmera dá zoom 2x no Pokémon da vez e segue o tiro nesse zoom (a arte vetorial continua nítida); Q/E ou arrastar a tela afastam para ver o mapa inteiro. Ao abrir uma fase aparece **Preparando a batalha…** até as fotos do cenário e a primeira pose de cada Pokémon ficarem prontas (a batalha espera; as outras poses chegam com o jogo rodando). O modo leve só baixa um pouco a resolução.

**Desempenho (modo SVG):** a tela é dividida em camadas (fundos, terreno, Pokémon/tiros, primeiro plano, painel). A câmera desloca as camadas inteiras por CSS, feito pela placa de vídeo, então andar e dar zoom não obriga a repintar o cenário. Pokémon e Pokébolas do chão são elementos próprios, atualizados no lugar. Em ⚙ Ajustes, **Mostrar FPS** exibe quantos quadros por segundo o aparelho está desenhando.

**No celular:** botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure TIRO para carregar e solte para atirar, BOLA, GOLPE (quando houver dois golpes), PASSAR, ↻ reinicia (pede confirmação), ⚙ ajustes à esquerda, ☰ menu, 🔊 som). Jogue com o celular deitado. Menus funcionam por toque. Em mapas largos, arraste na tela ou toque no minimapa para olhar o resto do mapa.

## Visual 2.5D e som

- Câmera com zoom que acompanha os tiros e a captura, treme nas explosões e tem camadas de parallax (céu, montanhas, prédios/pinheiros, terreno e capim em primeiro plano).
- Terreno com espessura, camadas de rocha e grama chamuscada nas crateras; cada fase tem seu tema (campo, floresta, praia, caverna, noite, usina, cabo, gelo, lava, vitória, montanha).
- Todo o som é sintetizado no navegador (Web Audio), sem arquivos.

## Estrutura

```
index.html      esqueleto SVG (gradientes, camadas, botões)
js/sfx.js       sons e música
js/data.js      tipos, ataques, variantes de golpe, espécies, cenários e fases
js/art.js       desenhos dos personagens, Pokébola, treinador e cenário
js/art2.js      desenhos da segunda leva de Pokémon (Fantasma, Gelo, Lutador...), Electabuzz remasterizado
js/animated-kanto.js  animações das cinco versões de Pokémon aprovadas
js/gl.js        desenho em WebGL: lotes de imagens, atlas de poses, textos, formas, shader do terreno, brilhos
js/ai-worker.js simulação dos tiros da CPU em segundo plano
sw.js           cópia offline dos arquivos (jogo instalável)
manifest.webmanifest, icons/  dados do app instalável
js/game.js      motor: física, turnos, IA, captura, fase inicial, campanha e menus
animated-kanto/index.html  prévia das cinco animações com controles
tests/kanto-integration.test.cjs  validação da integração com o motor
```

