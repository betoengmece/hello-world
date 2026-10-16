# Arena Flutuante

Demo de artilharia por turnos no estilo dos jogos de "mobiles" (ilhas flutuantes, vento, força e ordem por atraso). Projeto separado do jogo `worms-svg`, num arquivo HTML só, desenhado em Canvas 2D, sem dependências: abra `index.html` no navegador.

- **2 × 2:** você e um aliado (CPU) contra dois inimigos (CPU). Quem cai das ilhas está fora.
- **Ordem por atraso:** cada tiro soma atraso (tiro 1 < tiro 2 < especial), e andar e demorar também somam. Joga quem tem o menor atraso.
- **Vento** em qualquer direção, com força de 0 a 22, muda a cada turno.
- **Mostrador de ângulo** (o ângulo é relativo à inclinação do mobile no terreno), **barra de força** com marca do último tiro e **barra de movimento**.
- **Especial (SS):** a barra enche conforme o dano causado.

## Mobiles (desenhos originais)

| Mobile | Tiro 1 | Tiro 2 | SS |
|---|---|---|---|
| **Ricochete** (carrinho com braço lançador) | Bumerangue: faz curva, volta e sofre muito com o vento | Revoada: 3 bumerangues menores | Lâmina Gigante: atravessa o terreno abrindo túnel |
| **Faísca** (tripé com bobina) | Raio: a esfera marca o ponto e um raio cai do céu | Raio Triplo: 3 raios lado a lado | Tempestade: 5 raios em sequência |

## Controles

← → andar · ↑ ↓ ângulo · segure Espaço e solte para atirar · 1 / 2 / 3 escolhem o tiro · P passa a vez · arraste o cenário ou toque no minimapa para olhar o mapa. No celular há botões na tela.
