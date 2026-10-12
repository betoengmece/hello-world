# Monstrinhos de Artilharia

Jogo de artilharia por turnos feito inteiramente com SVG. Personagens, terreno destrutível, mira e projéteis são elementos `<svg>`; o JavaScript só cuida da lógica. Um único arquivo HTML, sem dependências.

## Personagens e tiros

| Time | Tiro | Como funciona |
|---|---|---|
| **Fogo** (lagartos) | Bola de fogo | Um tiro forte com explosão grande, que destrói bastante terreno. |
| **Planta** (com bulbo) | Três folhas em leque | Cada folha causa pouco dano e cai mais rápido. Escava pouco terreno, mas pode acertar vários alvos. |
| **Água** (tartarugas) | Jato d'água | Não destrói terreno e empurra os atingidos para longe. |
| **Volt** (rato elétrico, neutro) | Raio em ziguezague | No meio do campo. Ao fim de cada rodada completa, atira para um lado sorteado. |

## Como jogar

Abra `index.html` no navegador.

| Tecla | Ação |
|---|---|
| ← / → | andar (limite por turno) |
| ↑ / ↓ | mirar |
| Segurar ESPAÇO | carregar força; soltar para atirar |
| TAB | trocar de personagem |
| R | reiniciar |

**No celular:** use os botões na tela (◀ ▶ andar, ▲ ▼ mirar, segure TIRO para carregar e solte para atirar, ⇄ troca de personagem, ↻ reinicia). Jogue com o celular deitado.

Três times jogam por turnos no mesmo aparelho. Explosões destroem o terreno, personagens sem apoio caem, e quem cair na água morre. Vence o último time com personagens vivos.
