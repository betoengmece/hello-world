# Conceitos escolhidos e animados

Seleção do usuário: Beedrill V1, Jigglypuff V1, Dugtrio V3, Exeggutor V3 e Snorlax V2. Todos os demais conceitos foram excluídos desta implementação.

As artes originais ficam em `svg/`. O módulo `../js/animated-kanto.js` contém os mesmos desenhos com partes articuladas. Usa o contexto do jogo (`f`, `blink`, `bob`, `step`, `breath`, `x`, `flap`) e o relógio do motor, sem temporizadores independentes. O motor continua cuidando do espelhamento, sombra e dano.

As animações podem ser vistas em `index.html`: repouso, caminhada e ataque. É uma prévia de movimento; não muda as escolhas dos desenhos. Os cinco personagens são registrados no renderizador do jogo. Sua distribuição entre fases e seus atributos de combate ficam para a integração de gameplay.
