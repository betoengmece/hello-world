# Análise das piscadas no WebGL — sem implementação

Esta análise aprofunda o problema 4 da lista apresentada ao usuário. As correções de tiro e agendamento do modo leve são separadas. **O arquivo `js/gl.js` permanece idêntico ao da versão 17/10 l** (`fd8b65b3c9cf1bd88e91f8ba64547201c063d916`); nenhuma das soluções abaixo foi aplicada.

## Conclusão

Existem dois mecanismos diferentes que podem fazer desenhos desaparecerem. A primeira intervenção recomendada é corrigir a ordem de envio do lote e alocação de textura. Depois disso, deve-se medir a frequência dos reinícios completos do atlas antes de escolher uma alteração maior de cache. A correção pequena não garante eliminar piscadas causadas por reinícios completos.

## 1. Crescimento do atlas perde desenhos pendentes

O renderizador guarda vários desenhos num lote antes de enviá-lo à GPU. `putSprite()` chama `alloc()` antes de `flush()`. Se `alloc()` precisar de outra página, chama `newPage()` → `mkTex()`. `mkTex()` troca a textura vinculada e limpa `cur`. Quando `flush()` finalmente roda, vê `cur=null` e descarta a contagem pendente em vez de desenhá-la.

Não é uma falta de resolução dos SVGs, um erro do shader ou uma limitação do aparelho. É uma ordem incorreta de operações, reproduzível no próprio renderizador.

### Experimento de diagnóstico

Foi usado `MS.makeGL()` original, sem substituir funções nem editar `gl.js`:

1. Iniciar um quadro e enfileirar um retângulo vermelho.
2. Pedir uma imagem de 2040×2040 por `cvSprite()`, exigindo uma nova página depois das formas básicas.
3. Finalizar o quadro e ler o pixel onde deveria estar o retângulo.
4. Repetir, mas enviar explicitamente o lote por `R.end()` antes de solicitar a imagem.

| Experimento | Pixel RGBA | Chamadas de desenho | Erro WebGL |
|---|---|---:|---:|
| Fluxo atual, sem envio antecipado | `[0,0,0,255]` — preto | 0 | 0 |
| Envio explícito antes da alocação | `[255,0,0,255]` — vermelho | 1 | 0 |

O segundo caso é um diagnóstico por chamadas da API existente, não uma implementação de correção. Ele confirma que preservar/enviar o lote antes de trocar a textura resolve esse descarte específico, sem alterar imagens, resolução ou tamanho do atlas.

### Onde corrigir: alternativas

| Alternativa | Benefício | Limite/tradeoff |
|---|---|---|
| **Mover o `flush()` de `putSprite()` para antes de `alloc()`** | Protege o lote antes de uma alocação que possa criar páginas ou reiniciar o atlas; alteração pequena e central. | Uma tentativa que não caiba no atlas também enviaria o lote; vale verificar esse caso. Não resolve sprites invalidados após reinício completo. |
| Executar `flush()` no início de `newPage()` | Corrige diretamente o caminho que perde o lote ao crescer; mexe num ponto pequeno. | Depende de manter protegidos outros caminhos que troquem/excluam texturas. Também não resolve a invalidação global. |
| Centralizar a proteção em `mkTex()` | Define a regra de que criar/vincular textura nunca pode apagar trabalho pendente. | Exige auditar a responsabilidade entre funções de baixo nível e o agrupamento de desenhos; chamadas que já enviam lotes tornam-se redundantes. |

**Minha preferência inicial:** mover o envio para antes da alocação em `putSprite()`. Esse caminho atende imagens SVG, textos e formas em canvas. As operações de textura de camada inteira já possuem seus próprios envios prévios. Não há motivo para aplicar as três alternativas juntas.

A expectativa é eliminar a perda daquele lote, sem perder nitidez e sem aumentar a memória das texturas. Não há medição de ganho percentual de desempenho para essa mudança, pois ela não foi implementada.

## 2. Atlas cheio invalida imagens que já estavam prontas

Ao atingir o limite de páginas e não encontrar espaço, `alloc()` executa `resetAtlas()`. Isso exclui todas as páginas, incrementa a geração e limpa os caches/fila de SVG, textos e formas. `R.spr()` rejeita sprites de gerações antigas. O corpo anterior guardado em `u._glS` também deixa de ser um substituto válido.

### Experimento de diagnóstico

Foi criado um sprite pequeno e preenchido o restante com quatro páginas grandes. Uma quinta imagem grande forçou o reinício do atlas. O resultado foi:

- geração antes: `0`;
- geração depois: `1`;
- tentativa de desenhar o sprite que estava pronto: `false`.

Esse comportamento é intencional no desenho atual do cache, mas explica outra fonte de ausência temporária de Pokémon. Os SVGs precisam ser decodificados e enviados novamente. O orçamento de `pump()` e o limite de carregamentos simultâneos espalham a recuperação por vários quadros. A quantidade e a duração de ausências numa campanha longa ainda precisam ser medidas.

A redução de resolução por `glResK` diminui a pressão depois de certos reinícios, mas não preserva os sprites já invalidados, nem repara o lote perdido do primeiro problema.

### Soluções possíveis para a invalidação global

| Estratégia | O que resolve | Custo/limitação |
|---|---|---|
| Limpar/reorganizar o atlas entre fases, durante “Preparando…” | Evita carregar para a próxima batalha todo o histórico de espécies, poses e textos. | Aumenta o preparo e não garante que uma batalha grande caiba sem novo reinício. É uma opção simples para avaliar primeiro se os dados apontarem pressão entre fases. |
| Separar formas/textos de poses dos Pokémon | Nomes/danos/ícones novos deixam de disputar diretamente o espaço das animações principais. | Requer dividir o orçamento entre caches e gerenciar mais texturas; não elimina sozinho a necessidade de remoção. |
| Remover páginas pouco usadas com proteção das páginas do quadro atual | Evita invalidar todas as espécies ao mesmo tempo. | Exige validade por página, rastreamento de uso e remoção coerente das entradas de cache. O contador global de geração atual é insuficiente para uma troca isolada. |
| Construir um atlas novo mantendo o antigo até a troca | Permite preparar substitutos antes de descartar os desenhos visíveis. | Pode quase duplicar temporariamente a memória das páginas. Não é minha primeira escolha para TV. |
| Adiar o reinício para o limite entre quadros | Evita trocar a geração no meio da montagem de um quadro. | Precisa definir o que fazer quando faltar espaço; reiniciar só depois do quadro ainda deixa sprites ausentes no quadro seguinte se não houver substitutos. É uma proteção complementar. |

Não recomendo começar apenas aumentando o limite de páginas nem pré-carregando todas as espécies do jogo. Isso pode adiar o problema e aumentar muito a memória.

### Memória das páginas

Uma página RGBA de 2048×2048 ocupa teoricamente **16 MiB** de pixels. O limite de cinco páginas corresponde a **80 MiB**, quando todas forem alocadas. Dez páginas seriam **160 MiB**, antes de terreno, fundos, buffers e cópias internas do navegador. Esses números são cálculo de armazenamento de pixels, não medição total de VRAM de uma TV.

## Plano de validação recomendado para uma futura correção

1. Preservar os pixels já enfileirados ao criar a segunda/terceira página.
2. Exercitar o caminho de atlas cheio e garantir que não se use textura excluída/geração inválida.
3. Verificar que os lotes preservam a ordem de fundo, personagens, efeitos e clima.
4. Medir reinícios por minuto, pico de páginas, fila de decodificação e quadros sem corpo pronto em uma batalha com espécies distintas, movimento, dano e captura.
5. Repetir após redimensionar a tela, alternar qualidade e trocar SVG/WebGL: um reinício por troca de resolução é diferente de pressão de memória.
6. Confirmar o comportamento no navegador da TV antes de aumentar memória ou adotar um segundo atlas simultâneo.

A proposta é fazer primeiro a alteração pequena de ordem de operações e só depois decidir sobre o cache com medições. **Nesta entrega foi feita apenas a análise; o problema 4 permanece sem correção implementada, conforme solicitado.**
