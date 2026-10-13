# Monstrinhos de Artilharia

Jogo de artilharia por turnos feito inteiramente com SVG. Personagens, terreno destrutível, mira, projéteis e menus são elementos `<svg>`; o JavaScript só cuida da lógica. Sem dependências: abra o `index.html` no navegador.

> Projeto de fã, sem fins lucrativos. Pokémon e os nomes das criaturas pertencem a Nintendo / Game Freak / Creatures. Todas as artes aqui são desenhos próprios em SVG.

## Modos

### Campanha
1. **Fase inicial (cidade):** você é o treinador e tem **5 Pokébolas**. Acerte uma em quem quiser como parceiro.
   Os 3 iniciais (Charmander no terraço, Bulbasaur atrás do muro, Squirtle na lagoa) são difíceis de acertar; Pidgey, Rattata e Caterpie são fáceis. Quem a bola acertar primeiro vira o seu parceiro (se as bolas acabarem, um dos fracos decide te acompanhar).
2. **5 fases** em cenários diferentes: Rota 1, Floresta de Viridian, Praia, Caverna e o Covil do Dragão (chefe).
3. Cada fase é uma batalha por turnos, no mesmo estilo de tiro: você contra os Pokémon selvagens, que mirem sozinhos (a IA calcula o tiro e erra menos a cada fase).
4. **Captura:** quando um inimigo fica fraco (≤ 35% de PV) aparece uma Pokébola sobre ele. Aperte **B** (ou o botão **BOLA**), mire e arremesse. Se acertar um inimigo fraco, a chance de captura depende da espécie e de quão machucado ele está (aparece em % quando a bola está ativa). Acertar um inimigo ainda forte desperdiça a bola.
5. **Itens no campo:** cada fase tem Pokébolas espalhadas pelo chão. Ande até elas para pegar: Pokébola comum (+1), **Great Ball** (chance de captura ×1,5) e **Ultra Ball** (×2,3). As bolas melhores ficam guardadas entre as fases. Com a bola ativa, **B** de novo troca para a Great/Ultra e depois guarda.
6. **Clima:** nos cenários ao ar livre cada fase pode ter clima sorteado (a Caverna nunca tem): **Chuva** (golpes de Água +50%), **Sol forte** (Fogo e Planta +40%) ou **Tempestade** com relâmpagos e sem chuva (Elétrico +50%). O clima vale para os dois lados e aparece num selo no topo. O chefe do Covil do Dragão tem bem mais PV que um Dratini comum.
7. **Evolução:** ao vencer uma fase, quem lutou ganha XP (mais se causou dano). Ao encher a barra (aparece na tela de escolha do time) o Pokémon evolui, com uma cena de evolução: Charmander → Charmeleon, Bulbasaur → Ivysaur, Squirtle → Wartortle, Rattata → Raticate, Pidgey → Pidgeotto, Caterpie → Butterfree, Magikarp → Gyarados, Dratini → Dragonair. Gyarados e as evoluções são bem mais fortes.
8. **Visitantes neutros:** em cada fase um Pokémon neutro pode aparecer no meio do campo ("VISITANTE"), ficar por 2 a 4 rodadas atacando um lado sorteado (avisa antes qual), e depois ir embora e voltar mais tarde, ou não. Cada cenário tem os seus, com raridades diferentes (na Caverna, o Onix é o mais comum). Dá para derrubá-lo ou, melhor, enfraquecer e capturar com a Pokébola.
9. Seus Pokémon se curam entre as fases. Quando seu time passa de 3, você escolhe quais 3 levar. O progresso é salvo no navegador ao concluir cada fase.

### Versus
Três times (Fogo, Planta, Água) jogam por turnos no mesmo aparelho, com um Pikachu neutro no meio do campo que, ao fim de cada rodada, atira para um lado sorteado.

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
| Starmie | Água/Psíquico | Hidro Pulso: dois jatos |
| Magikarp | Água | Splash: não faz nada (mas é fácil de capturar) |
| Dratini | Dragão | Fúria do Dragão (chefe da campanha, pequeno e frágil) |
| Onix | Pedra/Terra | Lançar Pedra: pedra pesada que abre cratera (aparece como visitante na Caverna e no Covil) |
| Charmeleon / Ivysaur / Wartortle | Fogo / Planta / Água | versões mais fortes dos ataques iniciais |
| Raticate / Pidgeotto | Normal / Normal+Voador | Hiperpresa / Furacão |
| Butterfree | Inseto/Voador | Vento Prateado: três rajadas |
| Gyarados | Água/Voador | Hidro Bomba |
| Dragonair | Dragão | Cometa Dragão |

Relações usadas: Pedra > Fogo, Voador, Inseto · Terra > Fogo, Elétrico, Pedra · Água/Planta > Terra, Pedra · Fogo > Planta, Inseto · Água > Fogo · Planta > Água · Elétrico > Água, Voador · Inseto > Planta, Psíquico · Voador > Planta, Inseto · Dragão > Dragão (e resistências inversas, como Fogo < Água e Planta < Fogo).

## Controles

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Segurar ESPAÇO | carregar força; soltar para atirar |
| B | ativar/cancelar a Pokébola (campanha) |
| TAB | trocar de parceiro |
| R | reiniciar a fase / partida |
| M | liga/desliga o som |
| O (ou botão ⚙) | menu lateral de ajustes: brilho da tela e volume do som (o jogo pausa; ← → ajusta, ↑ ↓ escolhe). Fica salvo no navegador |
| ESC | volta ao menu |

**No celular:** botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure TIRO para carregar e solte para atirar, BOLA, ⇄ troca, ↻ reinicia, ☰ menu, 🔊 som). Jogue com o celular deitado. Menus funcionam por toque.

## Visual 2.5D e som

- Câmera com zoom que acompanha os tiros e a captura, treme nas explosões e tem camadas de parallax (céu, montanhas, prédios/pinheiros, terreno e capim em primeiro plano).
- Terreno com espessura, camadas de rocha e grama chamuscada nas crateras; cada fase tem seu tema (campo, floresta, praia, caverna, montanha).
- Todo o som é sintetizado no navegador (Web Audio), sem arquivos.

## Estrutura

```
index.html      esqueleto SVG (gradientes, camadas, botões)
js/sfx.js       sons e música
js/data.js      tipos, ataques, espécies, cenários e fases
js/art.js       desenhos dos personagens, Pokébola, treinador e cenário
js/game.js      motor: física, turnos, IA, captura, fase inicial, campanha e menus
```
