# Personagem em camadas

O guerreiro é montado empilhando imagens de **64×64** com fundo transparente, todas na mesma grade:

```
costas → base → botas → peitoral → capacete → arma
(atrás)                                    (na frente)
```

Por isso cada item novo é **um** desenho, e não um sprite inteiro pra cada combinação de equipamentos.

## Pastas

| Pasta | O que é | Quem mexe |
|---|---|---|
| `base.png` | Guerreiro sem equipamento e sem arma | desenho à mão |
| `formas/{slot}/{forma}.png` | Uma forma por item, desenhada **em tons de cinza** | desenho à mão |
| `unicos/{slot}/{nome}.png` | Itens com desenho próprio, sem variações de cor (ex.: Chapéu Goblin) | desenho à mão |
| `unicos/{slot}/{nome}.icone.png` | Opcional: ícone próprio do item único, em qualquer tamanho. Sem ele, o ícone é recortado da camada | desenho à mão |
| `camadas/` e `icones/` | Gerados automaticamente: **não edite à mão** | `npm run itens:gerar` |

Slots: `capacete`, `peitoral`, `arma`, `costas`, `botas`.

## Como desenhar uma forma

1. No Piskel ou Aseprite, abra a `base.png` como camada de referência (64×64).
2. Desenhe o item numa camada nova, por cima do guerreiro, e exporte **só essa camada**.
3. Pinte as partes que mudam de material com **exatamente** estes 4 tons:

   | Tom | Cor |
   |---|---|
   | sombra | `#222222` |
   | escuro | `#555555` |
   | médio | `#999999` |
   | brilho | `#dddddd` |

   Qualquer outra cor (couro, gemas, detalhes) fica igual em todos os materiais.
4. Salve em `formas/{slot}/{forma}.png` e rode, dentro de `frontend/`:

   ```
   npm run itens:gerar
   ```

   O script cria a versão de cada material (ferro, élfico, dourado; cores em `scripts/materiais.json`) e o ícone do inventário.
5. Commite também os arquivos gerados em `camadas/` e `icones/`.

A chave do item, que vai em `Item.imagemUrl` no banco (ver `backend/prisma/seed.js`), é `{slot}/{forma}--{material}`, por exemplo `peitoral/armadura--ferro`.

## Como adicionar um item a partir de uma arte pronta

Para armas, itens de costas e capacetes que já existem como imagem solta (em qualquer tamanho), coloque a imagem em `src/assets/images/` e rode, dentro de `frontend/`:

```
npm run itens:importar -- <arquivo> <slot> <nome-do-item>
npm run itens:importar -- Item_asas.png costas asas-flamejantes
```

O comando reduz a arte para a posição do slot no guerreiro (arma na mão, costas atrás dos ombros, capacete na cabeça), usa a imagem original como ícone do inventário e já roda o `itens:gerar`. A chave do item fica `{slot}/{nome-do-item}`.

Depois, cadastre o item no `backend/prisma/seed.js` (lista `itens`) e defina o desafio em `RECOMPENSAS_POR_DESAFIO`. Se algum jogador já tiver concluído esse desafio, rode `npm run recompensas:sincronizar` no backend para ele receber o item.

Botas e peitoral precisam acompanhar o formato do corpo, então devem ser desenhados como **forma** (seção acima), e não importados.

## Formas atuais

As formas de **elmo, espada, capa e botas** são **provisórias**, geradas por script só pra testar o sistema. Substituam pelos desenhos finais com o mesmo nome de arquivo. A **armadura** e o **Chapéu Goblin** vieram das artes originais, reduzidas pra grade de 64×64.

Itens únicos derivados de artes prontas (o ícone é a arte original):
- **Espada de Cristal** (`unicos/arma/espada-de-cristal`): `images/Item_espada.png` reduzida pra 8×28 na mão do guerreiro.
- **Botas Arcanas** (`unicos/botas/botas-arcanas`): o formato das botas pintado com os tons de roxo de `images/Item_bota.png`, que é um desenho de perfil e não encaixaria no guerreiro de frente.
