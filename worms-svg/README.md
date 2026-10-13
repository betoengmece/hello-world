# Monstrinhos de Artilharia

Jogo de artilharia por turnos feito inteiramente com SVG. Personagens, terreno destrutível, mira, projéteis e menus são elementos `<svg>`; o JavaScript só cuida da lógica. Sem dependências: abra o `index.html` no navegador.

> Projeto de fã, sem fins lucrativos. Pokémon e os nomes das criaturas pertencem a Nintendo / Game Freak / Creatures. Todas as artes aqui são desenhos próprios em SVG.

## Modos

### Campanha
1. **Fase inicial (cidade):** você é o treinador e tem **5 Pokébolas**. Acerte uma em quem quiser como parceiro.
   Os 3 iniciais (Charmander no terraço, Bulbasaur atrás do muro, Squirtle na lagoa) são difíceis de acertar; Pidgey, Rattata e Caterpie são fáceis. Quem a bola acertar primeiro vira o seu parceiro (se as bolas acabarem, um dos fracos decide te acompanhar).
2. **11 fases** em cenários diferentes: Rota 1, Floresta de Viridian, Praia, Caverna, Torre Pokémon (noite, Fantasma), Usina Abandonada, Cabo Cerúleo, Gruta Gelada (neve), Ilha Cinnabar (lava), Via Vitória (Lutador) e o Covil do Dragão (chefe).
   **Escolher fase:** no menu, "Escolher fase" lista as fases já liberadas, com os selvagens, visitantes e climas de cada uma, para você voltar e capturar o que ficou para trás. Seus Pokémon, XP e progresso são mantidos; rejogar uma fase antiga não reduz o progresso e não acumula bolas (só garante um mínimo de 4).
3. Cada fase é uma batalha por turnos, no mesmo estilo de tiro: você contra os Pokémon selvagens, que mirem sozinhos (a IA calcula o tiro e erra menos a cada fase).
4. **Captura:** quando um inimigo fica fraco (≤ 35% de PV) aparece uma Pokébola sobre ele. Aperte **B** (ou o botão **BOLA**), mire e arremesse. Se acertar um inimigo fraco, a chance de captura depende da espécie e de quão machucado ele está (aparece em % quando a bola está ativa). Acertar um inimigo ainda forte desperdiça a bola.
5. **Itens no campo:** cada fase tem Pokébolas espalhadas pelo chão. Ande até elas para pegar: Pokébola comum (+1), **Great Ball** (chance de captura ×1,5) e **Ultra Ball** (×2,3). As bolas melhores ficam guardadas entre as fases. Se o seu último tiro foi uma Pokébola, a próxima vez já começa com ela pronta (até você dar um tiro normal). Com a bola ativa, **B** de novo troca para a Great/Ultra e depois guarda.
6. **Clima:** nos cenários ao ar livre cada fase pode ter clima sorteado (a Caverna nunca tem): **Chuva** (golpes de Água +50%), **Sol forte** (Fogo e Planta +40%), **Tempestade** com relâmpagos e sem chuva (Elétrico +50%) e **Neve** (Gelo +50%). **O clima muda sozinho no meio da fase** (a cada 3 a 6 rodadas, com aviso na tela e transição suave). Vale para os dois lados e aparece num selo no topo. O chefe do Covil do Dragão tem bem mais PV que um Dratini comum.
7. **Evolução:** ao vencer uma fase, quem lutou ganha XP (mais se causou dano). Ao encher a barra (aparece na tela de escolha do time) o Pokémon evolui, com uma cena de evolução: Charmander → Charmeleon, Bulbasaur → Ivysaur, Squirtle → Wartortle, Rattata → Raticate, Pidgey → Pidgeotto, Caterpie → Butterfree, Magikarp → Gyarados, Dratini → Dragonair, Zubat → Golbat, Gastly → Gengar, Machop → Machamp, Growlithe → Arcanine. Gyarados e as evoluções são bem mais fortes.
   **Como upar o Magikarp:** ele ganha XP só por participar do time na fase (não precisa causar dano; e ganha 50% a mais de XP). Leve-o nas fases e, ao vencer, ele evolui para Gyarados (a barra de XP aparece na tela de escolha do time). Dá para rejogar uma fase pelo menu para treinar.
8. **Visitantes neutros:** em cada fase um Pokémon neutro pode aparecer no meio do campo ("VISITANTE"), ficar por 2 a 4 rodadas atacando um lado sorteado (avisa antes qual), e depois ir embora e voltar mais tarde, ou não. Cada cenário tem os seus, com raridades diferentes (na Caverna, o Onix é o mais comum). Dá para derrubá-lo ou, melhor, enfraquecer e capturar com a Pokébola.
9. Seus Pokémon se curam entre as fases. Quando seu time passa de 3, você escolhe quais 3 levar. O progresso é salvo no navegador ao concluir cada fase.
10. **Novos encontros:** Jigglypuff pode visitar a Rota 1; Beedrill é um inimigo da Floresta de Viridian; Exeggutor pode visitar a Praia; Dugtrio é um inimigo da Caverna; Snorlax é um visitante raro do Covil do Dragão, permanecendo por 7 rodadas para dar mais tempo de captura. Dratini continua sendo o chefe final.

11. **Golpes variantes (★):** cada indivíduo tem o seu conjunto de golpes. Além do golpe padrão da espécie, existem variantes (por exemplo um Pikachu com **Trovão**, mais forte, ou **Descarga Ampla**, mais área; Machop com **Mil Socos**, vários tiros, etc.). Indivíduos variantes aparecem com **★** ao lado do nome; os raros (**★★**) têm **os dois golpes** e você alterna entre eles com **G** (ou o botão **GOLPE**). A captura guarda o golpe do indivíduo, e a tela de escolha do time mostra os golpes de cada um. Nas fases mais avançadas as variantes ficam mais comuns. A IA dos selvagens com dois golpes simula os dois e usa o que promete mais dano.
12. **Novos Pokémon:** Geodude, Zubat/Golbat, Gastly/Gengar, Machop/Machamp, Growlithe/Arcanine, Seel, Lapras, Magnemite, Electabuzz, Magmar e Scyther, com os novos tipos **Fantasma**, **Gelo** e **Lutador**. O Magikarp também pode ter a variante **Batida** (um golpe fraco de verdade).

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
| Beedrill | Inseto/Veneno | Ferrão Venenoso: dois ferrões roxos, pouco dano ao terreno |
| Jigglypuff | Normal | Pancada: golpe que empurra o alvo |
| Dugtrio | Terra | Bomba de Lama: projétil pesado que abre cratera |
| Exeggutor | Planta/Psíquico | Bomba de Sementes: dois projéteis de Planta |
| Snorlax | Normal | Golpe Corporal: ataque forte que empurra o alvo |
| Geodude | Pedra/Terra | Atirar Pedra |
| Zubat / Golbat | Veneno/Voador | Onda Sônica (2 rajadas) / Presa Venenosa |
| Gastly / Gengar | Fantasma/Veneno | Lambida / Bola Sombria |
| Machop / Machamp | Lutador | Soco Focado / Golpe de Caratê (2 socos) |
| Growlithe / Arcanine | Fogo | Presa de Fogo / Roda de Fogo (2 bolas) |
| Seel / Lapras | Água/Gelo | Raio Aurora / Nevasca (2 estilhaços) |
| Magnemite | Elétrico | Onda de Choque (2 raios) |
| Electabuzz | Elétrico | Soco Trovão |
| Magmar | Fogo | Brasas (3 brasas) |
| Scyther | Inseto/Voador | Corte Duplo |
| Charmeleon / Ivysaur / Wartortle | Fogo / Planta / Água | versões mais fortes dos ataques iniciais |
| Raticate / Pidgeotto | Normal / Normal+Voador | Hiperpresa / Furacão |
| Butterfree | Inseto/Voador | Vento Prateado: três rajadas |
| Gyarados | Água/Voador | Hidro Bomba |
| Dragonair | Dragão | Cometa Dragão |

Relações usadas: Pedra > Fogo, Voador, Inseto · Terra > Fogo, Elétrico, Pedra, Veneno · Água/Planta > Terra, Pedra · Fogo > Planta, Inseto · Água > Fogo · Planta > Água · Elétrico > Água, Voador · Inseto > Planta, Psíquico · Voador > Planta, Inseto · Dragão > Dragão · Veneno > Planta · Psíquico > Veneno, Lutador. Gelo > Planta, Terra, Voador, Dragão (e Fogo > Gelo, Pedra > Gelo). Lutador > Normal, Pedra, Gelo (fraco contra Voador, Psíquico, Inseto, Veneno). Fantasma > Fantasma, Psíquico (Normal e Lutador quase não o afetam). Veneno é resistido por Veneno, Terra e Pedra; Veneno resiste a Planta e Inseto. O tipo Veneno não aplica dano contínuo. Os multiplicadores dos dois tipos são combinados quando o defensor tem tipo duplo.

## Controles

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Segurar ESPAÇO | carregar força; soltar para atirar |
| B | ativar/cancelar a Pokébola (campanha) |
| G | trocar de golpe (quando o Pokémon tem dois) |
| TAB | trocar de parceiro |
| R | reiniciar a fase |
| M | liga/desliga o som |
| O (ou botão ⚙) | menu lateral de ajustes: brilho da tela e volume do som (o jogo pausa; ← → ajusta, ↑ ↓ escolhe). Fica salvo no navegador |
| ESC | volta ao menu |

**No celular:** botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure TIRO para carregar e solte para atirar, BOLA, GOLPE (quando houver dois golpes), ⇄ troca, ↻ reinicia, ☰ menu, 🔊 som). Jogue com o celular deitado. Menus funcionam por toque.

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
js/art2.js      desenhos da segunda leva de Pokémon (Fantasma, Gelo, Lutador...)
js/animated-kanto.js  animações das cinco versões de Pokémon aprovadas
js/game.js      motor: física, turnos, IA, captura, fase inicial, campanha e menus
animated-kanto/index.html  prévia das cinco animações com controles
tests/kanto-integration.test.cjs  validação da integração com o motor
```

