# Monstrinhos de Artilharia

Jogo de artilharia por turnos feito inteiramente com SVG. Personagens, terreno destrutível, mira, projéteis e menus são elementos `<svg>`; o JavaScript só cuida da lógica. Sem dependências: abra o `index.html` no navegador.

> Projeto de fã, sem fins lucrativos. Pokémon e os nomes das criaturas pertencem a Nintendo / Game Freak / Creatures. Todas as artes aqui são desenhos próprios em SVG.

## Modos

### Campanha
1. **Fase inicial (cidade):** você é o treinador e tem **5 Pokébolas**. Acerte uma em quem quiser como parceiro.
   Os 3 iniciais (Charmander no terraço, Bulbasaur atrás do muro, Squirtle na lagoa) são difíceis de acertar; Pidgey, Rattata e Caterpie são fáceis. Quem a bola acertar primeiro vira o seu parceiro (se as bolas acabarem, um dos fracos decide te acompanhar).
2. **5 fases** em cenários diferentes: Rota 1, Floresta de Viridian, Praia, Caverna e o Covil do Dragão (chefe).
3. Cada fase é uma batalha por turnos, no mesmo estilo de tiro: você contra os Pokémon selvagens, que miram sozinhos (a IA calcula o tiro e erra menos a cada fase).
4. **Captura:** quando um inimigo fica fraco (≤ 35% de PV) aparece uma Pokébola sobre ele. Aperte **B** (ou o botão **BOLA**), mire e arremesse. Se acertar um inimigo fraco, a chance de captura depende da espécie e de quão machucado ele está (aparece em % quando a bola está ativa). Acertar um inimigo ainda forte desperdiça a bola.
5. Seus Pokémon se curam entre as fases. Quando seu time passa de 3, você escolhe quais 3 levar. O progresso é salvo no navegador ao concluir cada fase.

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
| Caterpie | Inseto | Teia: dano baixo, mas o atingido fica preso e perde a vez no próximo turno do seu time |
| Starmie | Água/Psíquico | Hidro Pulso: dois jatos |
| Magikarp | Água | Splash: não faz nada (mas é fácil de capturar) |
| Dratini | Dragão | Fúria do Dragão (chefe da campanha) |

Relações usadas: Fogo > Planta, Inseto · Água > Fogo · Planta > Água · Elétrico > Água, Voador · Inseto > Planta, Psíquico · Voador > Planta, Inseto · Dragão > Dragão. Os pares inversos (por exemplo Fogo contra Água) causam metade do dano.

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
| ESC | volta ao menu |

**No celular:** botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure TIRO para carregar e solte para atirar, BOLA, ⇄ troca, ↻ reinicia, ☰ menu, 🔊 som). Jogue com o celular deitado. Menus funcionam por toque.

O ângulo da mira é lembrado: o último usado continua no turno seguinte e ao reiniciar a fase.

## Visual 2.5D e som

- Cada ataque tem seu efeito: clarão na boca, rastro de partículas no voo (brasas, gotas, folhas, faíscas, rajadas, fios de teia) e clarão de tela nas explosões fortes.
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
