# Lagarto de Fogo

Jogo de artilharia por turnos feito inteiramente com SVG. Os lagartos de fogo, o terreno destrutível, a mira e a bola de fogo são todos elementos `<svg>`; o JavaScript só cuida da lógica. Um único arquivo HTML, sem dependências.

## Como jogar

Abra `index.html` no navegador.

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Segurar ESPAÇO | carregar força; soltar para soltar fogo |
| TAB | trocar de lagarto |
| R | reiniciar |

**No celular:** use os botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure FOGO para carregar e solte para atirar, ⇄ troca de lagarto, ↻ reinicia). Jogue com o celular deitado.

Dois times de três lagartos jogam por turnos no mesmo aparelho. Cada disparo sai como uma bola de fogo com rastro, e explosões destroem o terreno. Lagartos sem apoio caem, e quem cair na água morre.
