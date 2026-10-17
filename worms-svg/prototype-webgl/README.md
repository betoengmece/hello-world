# Pokémon: protótipo PixiJS / WebGL

Experimento isolado a partir de `betoengmece/hello-world@d8d902a148ee9e661384b707b7f1e16b11d0a1b1` (17/10 g). Não substitui o jogo principal. Usa chaves de salvamento próprias.

## Testar

Abra o endereço publicado. Aguarde a preparação dos desenhos. Alterne **WebGL** / **SVG**, escolhendo o mesmo cenário e o mesmo limite de FPS. **Reiniciar** recria a batalha com a mesma semente. Compare também a resposta durante tiros e a vez dos inimigos, não apenas parado. O botão **Salvar resultado** baixa um JSON local; não envia informações a servidor.

- Batalha simples: Pikachu contra dois inimigos, sem chuva.
- Batalha com chuva: mapa largo e seis personagens, com IA.
- Até 30 FPS: para comparar consumo em uma meta mais baixa; até 60 FPS: para comparar fluidez.
- Detalhe 192: mais definição ao ampliar; detalhe 128: menos memória na TV. Fire TV começa em 128.
- Teclado: setas movem/miram; segure espaço e solte para disparar; B captura; G troca golpe; P passa; Q/E deslocam câmera.
- Celular: controles de toque do jogo; recomendado deitado.
- Controle no Fire TV: O atira, L1/R1 andam, triângulo/quadrado miram, Create troca golpe.

## O que foi portado

O mundo de batalha usa PixiJS 7.4.3/WebGL: personagens animados, Pokébolas, tiros, partículas, efeitos, chuva, câmera e terreno destrutível. O painel e os menus continuam em SVG. Regras, colisão, IA, turnos, capturas e comandos usam a cópia do motor original.

Os SVGs originais são fontes dos personagens. Somente as espécies da batalha são convertidas em atlas na memória no carregamento, com 24 poses amostradas por espécie. Não há conversão SVG/PNG durante a animação nem requisições de arquivos de imagem por quadro. A resolução muda a quantidade de memória dos atlas; isso não converte a arte original do repositório.

O terreno é desenhado diretamente da máscara de colisão para uma textura, atualizada após alterações. O contorno SVG por marching squares deixa de ser calculado no modo WebGL. A textura visual do chão e os efeitos de projéteis são adaptações simplificadas: este protótipo compara uma arquitetura de renderização, não duas telas visualmente idênticas. Fundo e nuvens são rasterizados uma vez e ficam estáticos, com parallax da câmera. O zoom fica desligado nos dois modos.

No experimento, ambos os modos compartilham o mesmo limite por tempo transcorrido. A resolução da superfície WebGL é de 800×500 unidades com densidade máxima de 1,5. Uma migração completa deve tratar redimensionamento da superfície, ciclos de animação mais refinados, visuais dos golpes, sombras/status/shiny e todos os menus.

## Medidas e limites

O contador mostra quadros desenhados no último segundo e o tempo médio em JavaScript para atualizar/desenhar o quadro. Esse tempo não inclui necessariamente toda a renderização da GPU, nem mede temperatura ou bateria. O protótipo pede WebGL e informa fallback para SVG se o navegador não o disponibilizar. Aceleração por hardware varia entre TVs; melhor desempenho não é garantido.

A biblioteca é incluída localmente: o jogo não depende de CDN. Não há analytics, servidor de jogo nem coleta de dados.

Para executar os arquivos localmente: `python3 -m http.server 8080` e abrir `http://localhost:8080`. Hospedagem estática usa esta pasta.
