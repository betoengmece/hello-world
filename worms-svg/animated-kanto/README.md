# Conceitos escolhidos e animados

Seleção do usuário: Beedrill V1, Jigglypuff V1, Dugtrio V3, Exeggutor V3 e Snorlax V2. Todos os demais conceitos foram excluídos desta implementação.

As artes originais ficam em `svg/`. O módulo `../js/animated-kanto.js` contém os mesmos desenhos com partes articuladas. Usa o contexto do jogo (`f`, `blink`, `bob`, `step`, `breath`, `x`, `flap`) e o relógio do motor, sem temporizadores independentes. O motor continua cuidando do espelhamento, sombra e dano.

As animações podem ser vistas em `index.html`: repouso, caminhada e ataque. Os cinco personagens também estão integrados à campanha, com vida, ataques, área de acerto, origem dos projéteis e captura.

| Pokémon | Fase | Encontro | Ataque | Vida base |
|---|---|---|---|---|
| Jigglypuff V1 | Rota 1 | Visitante, raridade 0,24 | Pancada (Normal) | 80 |
| Beedrill V1 | Floresta de Viridian | Inimigo fixo, no lugar de um Caterpie | Ferrão Venenoso (Veneno) | 95 |
| Exeggutor V3 | Praia | Visitante, raridade 0,14 | Bomba de Sementes (Planta) | 125 |
| Dugtrio V3 | Caverna | Inimigo fixo, no lugar de Pidgey | Bomba de Lama (Terra) | 105 |
| Snorlax V2 | Covil do Dragão | Visitante raro, raridade 0,08, permanece 7 rodadas | Golpe Corporal (Normal) | 175 |

Raridade é o parâmetro de cada tentativa de aparecimento, sujeito à disputa entre visitantes e ao intervalo entre aparições; não representa a chance total por partida. Dratini continua sendo o chefe final. O multiplicador de vida da fase também vale para os novos inimigos fixos.

O tipo Veneno tem cor e nome próprios, relações de dano, projéteis em forma de ferrão, partículas roxas e som. Beedrill é Inseto/Veneno. Veneno causa dano dobrado em Planta e metade em Veneno, Terra e Pedra; Planta e Inseto são resistidos por Veneno, e Terra e Psíquico são fortes contra ele. O tipo não acrescenta uma condição de dano contínuo.

Validação: `node worms-svg/tests/kanto-integration.test.cjs` a partir da raiz do repositório. O teste executa o motor com elementos de interface simulados e verifica relações de tipos, fases, visitantes, capturabilidade, ataques, renderização e saves. Não substitui uma partida manual no navegador.
