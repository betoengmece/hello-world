# Worms SVG

Jogo de artilharia por turnos, inspirado em Worms, feito inteiramente com SVG.
Todo o cenário, o terreno destrutível e os personagens são elementos `<svg>`; o JavaScript só cuida da lógica. Um único arquivo HTML, sem dependências.

## Como jogar

Abra `index.html` no navegador.

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Segurar ESPAÇO | carregar força; soltar para atirar |
| TAB | trocar de verme |
| R | reiniciar |

**No celular:** use os botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure FOGO para carregar e solte para atirar, ⇄ troca de verme, ↻ reinicia). Jogue com o celular deitado.

Dois times de três vermes jogam por turnos no mesmo teclado. Explosões destroem o terreno, vermes sem apoio caem, e quem cair na água morre.
