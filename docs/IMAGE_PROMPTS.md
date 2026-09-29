# BitSub: prompts de imagem para o ChatGPT

Estes prompts são para gerar a arte do BitSub no ChatGPT, que hoje (set/2026) usa o **ChatGPT Images 2.5 / GPT Image 2.5**.

> **Os prompts estão em inglês de propósito.** O modelo segue instruções em inglês com mais precisão, principalmente as de estilo (pixel art, grid, paleta) e de texto. Você pode conversar com o ChatGPT em português nos ajustes, mas **cole os prompts como estão**.

---

## 0. O que a pesquisa mostrou (resumo)

| Tema | O que funciona / o que esperar |
|---|---|
| **Estrutura do prompt** | Blocos rotulados (fundo → assunto → detalhes → restrições) funcionam melhor que um parágrafo corrido. Comece com um prompt limpo e ajuste **uma coisa por vez**. |
| **Edição** | Use sempre *"change only X, keep everything else the same"* e repita a lista do que deve ficar igual a cada rodada. O 2.5 segura bem as edições em várias rodadas, mas ainda "deriva" um pouco. |
| **Consistência** | Crie primeiro a imagem-âncora do personagem e **anexe ela** em todo prompt seguinte ("Image 1 = …"). Frases como "same style as before" ajudam, mas anexar a imagem é o que garante. |
| **Transparência** | No 2.5 o fundo transparente é recurso oficial (no 2.0 era só "preview" e muita gente recebia **xadrez pintado** em vez de alfa real). Peça explicitamente e **confira o arquivo**. A barra de edição do 2.5 também tem **Remove BG**. |
| **Tamanhos** | Os formatos nativos são 1:1 (1024×1024), 3:2 (1536×1024) e 2:3 (1024×1536). A ferramenta **Resize** troca para 16:9, 4:3 e 3:4. Tamanhos exatos como 1200×630 **não saem prontos**: gere perto disso e a gente recorta. |
| **Texto na imagem** | Texto curto sai bem: coloque entre aspas, **soletre letra por letra** e diga "exatamente uma vez, sem caracteres extras". Texto longo ainda erra. |
| **Cores hex** | O modelo **não garante hex exato**. Ajuda passar hex + nome da cor + anexar a amostra da paleta (`docs/art-src/slso8-palette.png`). A cor exata vem depois, no pós-processamento. |
| **Pixel art** | A IA faz "pixel art falsa": pixels de tamanhos diferentes, bordas suavizadas, cores a mais. O que ajuda: definir o grid ("32×32 grid, each art pixel a perfect square block"), "no anti-aliasing, no gradients, no glow", vista frontal reta, personagem centralizado com margem. **Não dá para corrigir depois:** sombra suave, objeto cortado na borda, grid torto e vários objetos grudados. |
| **Falhas comuns** | Letras ou números inventados, palavra errada, marca d'água, detalhe demais para tamanho pequeno, fundo "cenário" quando você pediu vazio, perspectiva 3D quando você pediu frontal. As correções estão na seção 3. |

Fontes: [OpenAI cookbook: GPT Image prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide), [gpt-image-1.5 prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide), [OpenAI API: image generation](https://developers.openai.com/api/docs/guides/image-generation), [Wikipedia: GPT Image](https://en.wikipedia.org/wiki/GPT_Image), [9to5Mac: Images 2.5](https://9to5mac.com/2026/09/08/openai-releases-chatgpt-images-2-5-with-sharper-details-and-more-precise-editing/), [Fello AI: Images 2.5 (Remove BG / Resize)](https://felloai.com/chatgpt-images-2-5/), [Renoise: what changed in 2.5](https://renoise.ai/blog/chatgpt-images-2-5-explained), [OpenAI community: fake transparency](https://community.openai.com/t/having-trouble-getting-transparent-backgrounds-in-chatgpt-images/1380143), [Pixel Refiner: prompt recipes](https://pixel-refiner.app/guide.html).

---

## 1. Como usar

### 1.1 Ordem de geração
1. **Mascote** (prompt 1A) → escolha a melhor e salve. Ela é a âncora de tudo.
2. **Folha de expressões** (1B), anexando a mascote.
3. **Ícone do app** (2A sem texto → 2B com wordmark → 2C maskable), anexando a mascote.
4. **Símbolo do favicon** (4).
5. **Wordmark** (3).
6. **Ilustrações de estado** (5.1 a 5.6), anexando a mascote (e a folha de expressões).
7. **Imagem social / OG** (6), anexando a mascote.

### 1.2 Consistência (o mais importante)
- **Anexe sempre a mascote aprovada** (`bitsub-mascot.png`) nos prompts 1B a 6. Os prompts já começam com "Image 1 is…" para você só anexar e colar.
- **Anexe também a paleta**: `docs/art-src/slso8-palette.png` (8 quadrados com as cores exatas). Quando anexar as duas, anexe na ordem: mascote primeiro, paleta depois.
- No prompt 1A, anexe o ícone do BitTask (`D:\sback\bitprojects\bittask\public\icons\icon-512.png`) para puxar o "DNA" do robô. O prompt já avisa para **não** copiar a pilha de papéis nem o texto.
- Faça cada grupo de imagens numa conversa só. Se o estilo começar a mudar, **abra uma conversa nova** e reanexe a mascote. Isso resolve melhor que insistir.
- Peça 2 ou 3 variações quando for algo novo ("Give me 3 variations"). Para ajustes, peça uma só.

### 1.3 Fundo transparente
1. Os prompts de itens transparentes já pedem: *"Transparent background (real alpha channel, RGBA PNG). No checkerboard, no backdrop…"*
2. **Baixe pelo botão de download** do ChatGPT. Não copie e cole, e não tire print, porque isso achata o alfa.
3. **Confira:** arraste o PNG para uma aba do Chrome. Se o fundo aparecer liso (cinza escuro do navegador), está certo. Se aparecer um **quadriculado branco e cinza dentro da imagem**, é xadrez pintado, ou seja, falso.
4. Se veio falso, use o botão **Remove BG** na barra de edição da imagem. Se não resolver, use a edição 3.1.
5. **Plano B (o mais confiável para pixel art):** peça fundo **magenta sólido `#FF00FF`** (cor que não existe na paleta). Na limpeza, o magenta vira transparente sem deixar borda.

### 1.4 Limpeza final (eu faço)
Mesmo com prompt perfeito, a imagem da IA vem em 1024 px com "pixels" irregulares e cores quase certas. A limpeza tem 3 passos:
1. Reduzir para o grid real (ex.: 32×32) com *nearest neighbor*.
2. Trocar cada pixel pela cor SLSO8 mais próxima e transformar magenta em transparente.
3. Ampliar em múltiplo inteiro para o tamanho de exportação.

**Caminho fácil:** salve os originais do ChatGPT em `docs/art-src/` com os nomes da tabela abaixo e me avise. Eu faço a limpeza, gero todos os tamanhos e coloco nas pastas certas. Se quiser fazer você mesmo: [Pixel Refiner](https://pixel-refiner.app/) ou Aseprite (redimensionar sem suavização + paleta SLSO8 do [Lospec](https://lospec.com/palette-list/slso8)).

### 1.5 Arquivos: nomes, tamanhos e onde ficam

**Originais do ChatGPT** (não vão para o app): `docs/art-src/`

| Original (salvar assim) | Prompt |
|---|---|
| `bitsub-mascot.png` | 1A |
| `bitsub-mascot-expressions.png` | 1B |
| `bitsub-icon-master.png` | 2A (1024×1024, sem texto) |
| `bitsub-icon-wordmark-master.png` | 2B |
| `bitsub-icon-maskable-master.png` | 2C (opcional: posso derivar do 2A) |
| `bitsub-wordmark-cream.png` / `bitsub-wordmark-navy.png` | 3 |
| `bitsub-favicon-master.png` | 4 |
| `state-empty.png`, `state-success.png`, `state-no-subs.png`, `state-offline.png`, `state-ai-thinking.png`, `state-key-privacy.png` | 5.1–5.6 |
| `bitsub-og-master.png` | 6 |

**Arquivos finais** (depois da limpeza):

| Arquivo | Tamanho | Pasta | Origem |
|---|---|---|---|
| `icon-512.png` | 512×512 | `public/icons/` | 2A |
| `icon-192.png` | 192×192 | `public/icons/` | 2A |
| `icon-maskable-512.png` | 512×512 | `public/icons/` | 2C (arte dentro dos 80% centrais) |
| `icon-maskable-192.png` | 192×192 | `public/icons/` | 2C |
| `apple-touch-icon.png` | 180×180, fundo sólido | `public/icons/` | 2A |
| `favicon-32.png` | 32×32 | `public/icons/` | 4 |
| `favicon-16.png` | 16×16 | `public/icons/` | 4 |
| `favicon.ico` | 16 + 32 + 48 | `public/` (raiz) | 4 |
| `mascot.png` | 256×256, transparente | `public/illustrations/` | 1A |
| `wordmark-cream.png` / `wordmark-navy.png` | 512 de largura, transparente | `public/illustrations/` | 3 |
| `empty.png`, `success.png`, `no-subs.png`, `offline.png`, `ai-thinking.png`, `key-privacy.png` | 256×256, transparente | `public/illustrations/` | 5 |
| `og-image.png` (+ `og-image-en.png`, `og-image-es.png`) | 1200×630 | `public/og/` | 6 + texto aplicado por nós |

Todos os ícones PWA saem de **um master de 1024×1024**. Se quiser gerar o pacote completo (Android, iOS, Windows), use o [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator), com padding 0 para o "any" e cerca de 0,2 para o maskable, ou o [RealFaviconGenerator](https://realfavicongenerator.net/) para favicon, ICO e apple-touch. **Maskable:** o Android corta o ícone em círculo ou em "gota", então a mascote tem que caber no **círculo central de 80%**. O fundo navy vai até a borda.

---

## 2. Bloco de estilo (já incluído em cada prompt)

Todos os prompts repetem este bloco. É de propósito: repetir reduz a deriva de estilo.

```
STYLE: authentic 8-bit pixel art, like a 1990s console sprite. Strict square pixel grid, every art pixel the same size, hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, NO soft shadows, flat colors only, 1-pixel dark outline.
PALETTE (SLSO8, use only these): cream #ffecd6, light peach #ffd4a3, orange #ffaa5e, copper #d08159, dusty mauve #8d697a, slate purple #544e68, dark blue #203c56, deep navy #0d2b45.
```

**O personagem (âncora textual, repetida onde precisa):** um robozinho da mesma espécie do robô do BitTask. Ele tem uma cabeça de tela quadrada com cantos levemente arredondados, dois olhos redondos cor creme e antenas-orelha cor cobre com ponta laranja. O corpo é pequeno e atarracado, em malva e roxo-ardósia, com um painel laranja no peito. **O que é só do BitSub:** no lugar da boca, a tela mostra uma **barra de legenda**, que são duas linhas horizontais creme (uma longa e uma curta), como closed caption numa TV.

---

## 3. Correções: prompts de ajuste (cole como follow-up)

| Problema | Cole isto |
|---|---|
| 3.1 Transparência falsa (xadrez pintado) | `The background is a painted checkerboard, not real transparency. Output the same image with a truly transparent background (alpha channel, RGBA PNG). Change nothing else.`, ou use **Remove BG**. Se falhar: `Replace the background with solid flat magenta #FF00FF filling the whole canvas. Change nothing else.` |
| 3.2 Pixels borrados ou de tamanhos diferentes | `Redraw this as strict pixel art on a 32x32 grid: every art pixel is an identical, perfectly square, hard-edged block. No anti-aliasing, no blur, no half-pixels. Keep the exact same design, pose and colors.` (troque 32 pelo grid do prompt) |
| 3.3 Cores fora da paleta, degradê ou brilho | `Use only the 8 colors in the attached palette image. Remove every gradient, glow, soft shadow and color not in the palette. Keep everything else the same.` |
| 3.4 Letras, números, marca d'água ou símbolos inventados | `Remove all text, letters, numbers, logos and watermarks. Do not add any text anywhere. Keep everything else the same.` |
| 3.5 Wordmark escrito errado | `The text must read exactly "BitSub": B-i-t-S-u-b, six letters, capital B and capital S, lowercase i, t, u, b. It appears exactly once, with no extra characters. Keep the style.` |
| 3.6 Detalhe demais para ícone pequeno | `Simplify for a 64x64 display: fewer details, bigger and bolder shapes, larger eyes, remove tiny props and texture. Keep the character recognizable.` |
| 3.7 A mascote mudou de cara | `Keep the robot exactly as in Image 1: same head shape, screen face, eyes, subtitle-bar mouth, antenna ears, body, colors and proportions. Change only the pose and the prop.` |
| 3.8 Cortado ou encostando na borda | `Zoom out: the whole subject must be visible, centered, with at least 12% empty margin on every side.` |
| 3.9 Ficou 3D, isométrico ou em perspectiva | `Straight-on front view, flat, no perspective, no isometric angle, no 3D shading.` |
| 3.10 Colocou cenário ou chão | `Remove the scenery, floor and shadow. Only the character and its prop, isolated.` |

---

## 4. Os prompts

### 1A. Mascote: imagem-âncora
- **Para quê:** base de tudo (ícone, estados, OG). Ela também vai para o app como `mascot.png`.
- **Formato:** 1:1 (1024×1024), grid de 32×32, fundo transparente.
- **Anexar:** ícone do BitTask (`bittask/public/icons/icon-512.png`) e `slso8-palette.png`.

```
Image 1 is the app icon of our sibling app BitTask. Image 2 is our color palette.
Create the mascot for BitSub, a free app that turns YouTube videos into subtitles and text. The mascot is the same robot species and the same pixel-art style as the robot in Image 1, but a new sibling character. Do NOT copy the paper stack, the sparkles or the "BitTask" text from Image 1.

SUBJECT: one small, cute robot, full body, straight-on front view, standing, centered, friendly and calm.
- Head: a big square screen with slightly rounded corners, frame in dusty mauve #8d697a, screen in deep navy #0d2b45.
- Face on the screen: two round cream #ffecd6 eyes. Instead of a mouth, a "subtitle bar": two horizontal cream lines under the eyes (top line long, bottom line short), like closed captions on a TV screen.
- Antenna ears: copper #d08159 with orange #ffaa5e tips, one on each side of the head.
- Body: small and stubby, dusty mauve #8d697a with slate purple #544e68 shading, a small orange #ffaa5e chest panel, short arms and legs.
- Head is about 55% of total height (big-head chibi proportions).

STYLE: authentic 8-bit pixel art, like a 1990s console sprite. Designed on a 32x32 pixel grid and shown enlarged: every art pixel is an identical, perfectly square block. Hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, NO soft shadows, flat colors only, 1-pixel deep navy #0d2b45 outline.
PALETTE (SLSO8, use only these): cream #ffecd6, light peach #ffd4a3, orange #ffaa5e, copper #d08159, dusty mauve #8d697a, slate purple #544e68, dark blue #203c56, deep navy #0d2b45. Use at most 7 of them.
READABILITY: simple silhouette that is still clear at 64x64 pixels. No tiny details.
BACKGROUND: transparent background (real alpha channel, RGBA PNG). No checkerboard, no backdrop, no floor, no shadow. At least 12% empty margin on every side.
NO text, letters, numbers or watermark anywhere.
```

### 1B. Folha de expressões (para os estados)
- **Formato:** 1:1, uma grade 2×2 com 4 poses, transparente.
- **Anexar:** `bitsub-mascot.png` e a paleta.

```
Image 1 is our mascot (the BitSub robot). Image 2 is our palette.
Create a 2x2 character sheet of THIS exact robot: same head shape, screen face, eyes, subtitle-bar mouth, antenna ears, body, colors and proportions. Do not redesign it. Only the face on the screen and the arms change.
- Top-left HAPPY: eyes as upward arcs (^ ^), one arm raised in a wave.
- Top-right SAD: eyes as downward arcs, subtitle bar replaced by one short flat line, arms down.
- Bottom-left THINKING: eyes looking up to one side, one hand on the chin.
- Bottom-right SLEEPING: eyes closed as two flat lines, head slightly tilted.
Each robot centered in its cell, same size, same 32x32 pixel grid, generous empty space between cells.

STYLE: authentic 8-bit pixel art, strict square pixel grid, every art pixel the same size, hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, NO soft shadows, flat colors, 1-pixel deep navy #0d2b45 outline.
PALETTE (SLSO8 only): #ffecd6, #ffd4a3, #ffaa5e, #d08159, #8d697a, #544e68, #203c56, #0d2b45.
BACKGROUND: transparent (real alpha, RGBA PNG), no checkerboard, no grid lines, no cell borders, no floor.
NO text, letters, labels or numbers.
```

### 2A. Ícone do app: master sem texto (recomendado para todos os ícones PWA)
- **Formato:** 1:1 (1024×1024), grid de 64×64, **fundo navy sólido** (ícone não pode ser transparente).
- **Anexar:** `bitsub-mascot.png` e a paleta.
- **Por que sem texto:** no celular o ícone aparece com 48–64 px e o nome do app já vem escrito embaixo. Um "BitSub" dentro do ícone vira borrão nesse tamanho. O BitTask usa texto no ícone, mas a família continua reconhecível pela mascote, pelo navy e pelas scanlines.

```
Image 1 is our mascot (the BitSub robot). Image 2 is our palette.
Create a square app icon for BitSub, a free app that turns YouTube videos into subtitles and text.

BACKGROUND: solid deep navy #0d2b45 filling the entire square, edge to edge, with subtle horizontal CRT scanlines (every 4th row of art pixels in dark blue #203c56). No rounded corners, no border, no frame (the phone applies the mask).
SUBJECT: THIS exact robot from Image 1 (same head, screen face, subtitle-bar mouth, antenna ears, body, colors), shown from the chest up, large, centered in the upper part.
MOTIF: below the robot, a wide cream #ffecd6 speech bubble with square pixel corners, its small tail pointing up to the robot. Inside the bubble, two rows of deep navy #0d2b45 dash blocks that suggest subtitle text (abstract dashes, NOT letters).
EXTRAS: 2 or 3 small four-point pixel sparkles in cream #ffecd6 and orange #ffaa5e around the robot, like the sibling app BitTask.
COMPOSITION: all important elements inside the central 75% of the square, balanced, bold, high contrast, readable at 48x48 pixels.

STYLE: authentic 8-bit pixel art on a 64x64 grid shown enlarged: every art pixel is an identical, perfectly square block. Hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, flat colors.
PALETTE (SLSO8 only): cream #ffecd6, light peach #ffd4a3, orange #ffaa5e, copper #d08159, dusty mauve #8d697a, slate purple #544e68, dark blue #203c56, deep navy #0d2b45.
NO text, letters, numbers or watermark anywhere.
```

### 2B. Ícone com wordmark (variante: splash, README, loja, redes)
- **Formato:** 1:1, fundo navy. É o "irmão" direto do ícone do BitTask.
- **Anexar:** `bitsub-icon-master.png` (o 2A aprovado) e a paleta.

```
Image 1 is our approved BitSub app icon. Image 2 is our palette.
Create a variant of Image 1 that keeps the same navy #0d2b45 background with scanlines, the same robot, the same speech bubble and the same sparkles, but scaled down to fit the upper 70% of the square.
In the bottom 25%, add the word "BitSub" in a large, chunky, blocky 8-bit pixel font (in the style of "Press Start 2P"), cream #ffecd6, centered, with a 1-pixel dark blue #203c56 drop shadow offset down-right.
The text must read exactly "BitSub": B-i-t-S-u-b, six letters, capital B and capital S, lowercase i, t, u, b. It appears exactly once, with no other text or characters.
STYLE: authentic 8-bit pixel art, strict square pixel grid, NO anti-aliasing, NO blur, NO gradients, flat colors. SLSO8 palette only.
```

### 2C. Ícone maskable (zona segura)
- **Formato:** 1:1, fundo navy até a borda, arte no círculo central.
- **Anexar:** `bitsub-icon-master.png`.
- **Dica:** isso também dá para derivar do 2A reduzindo a arte para cerca de 70% e completando com navy. Eu faço isso sem perder nitidez. Use este prompt só se quiser uma versão redesenhada.

```
Image 1 is our approved BitSub app icon.
Create a maskable version of it: same design, same colors, same pixel style, but the robot, speech bubble and sparkles are scaled down so that ALL of them fit inside a centered circle whose diameter is 70% of the square width. The navy #0d2b45 background with scanlines still fills the entire square edge to edge. Nothing important outside that central circle. No rounded corners, no border.
Pixel art rules: strict square pixel grid, NO anti-aliasing, NO blur, NO gradients, flat SLSO8 colors only. NO text.
```

### 3. Wordmark "BitSub" (transparente, creme e navy)
- **Formato:** peça 3:2 (1536×1024). O texto fica no meio e a gente recorta.
- **Anexar:** a paleta.
- **Observação honesta:** no app, o nome também pode ser escrito com a fonte Press Start 2P em SVG, que fica perfeito em qualquer tamanho. Gere este aqui se quiser um logotipo **desenhado**, mais "gordinho", como o do ícone do BitTask. Gere a versão creme primeiro e depois peça a navy como edição.

```
Image 1 is our palette.
Create a pixel-art logotype of the word "BitSub".
The text must read exactly "BitSub": B-i-t-S-u-b, six letters, capital B and capital S, lowercase i, t, u, b. It appears exactly once, on one line, with no other text, characters, icons or decorations.
LETTERING: chunky, blocky 8-bit video game title lettering (in the style of "Press Start 2P" but bolder), built from perfectly square pixels on a strict grid, each letter about 12 art pixels tall, even spacing, clean and very legible.
COLOR: letters in cream #ffecd6 with a 1-pixel deep navy #0d2b45 outline and a 2-pixel hard drop shadow in dark blue #203c56 offset down-right.
STYLE: NO anti-aliasing, NO blur, NO gradients, NO glow, NO 3D bevel, flat colors only.
BACKGROUND: transparent (real alpha channel, RGBA PNG), no checkerboard, no backdrop. Word centered horizontally with wide empty margins.
```
Variante navy (follow-up na mesma conversa):
```
Same logotype, same letter shapes and spacing. Change only the colors: letters in deep navy #0d2b45 with a 2-pixel hard drop shadow in orange #ffaa5e offset down-right, no outline. Keep the transparent background (real alpha, RGBA PNG). Change nothing else.
```

### 4. Símbolo do favicon (legível em 16 e 32 px)
- **Formato:** 1:1, **grid de 16×16** (cada pixel da arte vira um bloco enorme), tile navy sólido. Um favicon com fundo sólido funciona tanto em aba clara quanto escura.
- **Anexar:** a paleta. A opção B também leva a mascote.
- **Recomendação:** a opção **A** (balão de legenda). Em 16 px a cabeça do robô vira um borrão.

**Opção A: balão de legenda (recomendada)**
```
Image 1 is our palette.
Create a favicon designed on a tiny 16x16 pixel grid, shown enlarged so every art pixel is a huge, identical, perfectly square block (each art pixel = 1/16 of the image width).
DESIGN: solid deep navy #0d2b45 square filling the whole canvas. On it, an orange #ffaa5e speech bubble with square corners, about 12 pixels wide and 9 pixels tall, with a 2-pixel tail at the bottom-left. Inside the bubble, two horizontal deep navy #0d2b45 lines, one pixel thick: the top one long, the bottom one short, like subtitles.
Only 3 colors in total: #0d2b45, #ffaa5e, #ffecd6 (optional 1-pixel cream highlight on the bubble's top-left corner).
STYLE: pure pixel art, NO anti-aliasing, NO blur, NO gradients, NO texture, NO scanlines, NO outline glow. Maximum simplicity and contrast.
NO text, letters or numbers.
```

**Opção B: cabeça do robô**
```
Image 1 is our mascot. Image 2 is our palette.
Create a favicon of ONLY the head of the robot from Image 1, simplified to a tiny 16x16 pixel grid, shown enlarged so every art pixel is a huge, identical, perfectly square block.
Solid deep navy #0d2b45 background filling the canvas. Head: mauve #8d697a square frame, navy screen, two 2x2 cream #ffecd6 eyes, one cream subtitle line under them, orange #ffaa5e antenna tips on both sides. Maximum 4 colors.
Pure pixel art, NO anti-aliasing, NO blur, NO gradients, NO scanlines. NO text.
```

### 5. Ilustrações de estado (256×256, transparente, 5–8 cores SLSO8)
- **Formato:** 1:1 (1024×1024) representando um **grid de 64×64**. A mascote ocupa cerca de 32 pixels de altura, na mesma escala da imagem-âncora. Depois da limpeza fica em 256×256 (4 px por pixel da arte).
- **Anexar sempre:** `bitsub-mascot.png`, `bitsub-mascot-expressions.png` e a paleta.
- **Estilo Swiss:** só a mascote e **um** objeto, sem cenário, com muito espaço vazio. A UI é que emoldura.
- **Modo escuro:** o contorno navy some sobre o fundo navy. O app vai mostrar estas imagens num bloco `#203c56` no modo escuro, então não se preocupe com isso na geração.

Bloco comum (já está dentro de cada prompt abaixo):
```
Image 1 is our mascot, Image 2 its expression sheet, Image 3 our palette. Use THIS exact robot (same head, screen face, subtitle-bar mouth, antenna ears, body, colors, proportions); do not redesign it. The robot is about half the image height.
STYLE: authentic 8-bit pixel art on a 64x64 grid shown enlarged: every art pixel an identical, perfectly square block. Hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, NO soft shadows, flat colors, 1-pixel deep navy #0d2b45 outline. Use 5 to 8 colors, SLSO8 only: #ffecd6 #ffd4a3 #ffaa5e #d08159 #8d697a #544e68 #203c56 #0d2b45.
COMPOSITION: only the robot and one prop, no scenery, no floor, centered, at least 12% empty margin on every side, readable at 128x128.
BACKGROUND: transparent (real alpha, RGBA PNG), no checkerboard, no backdrop.
NO text, letters, numbers or watermark.
```

**5.1 Vazio: nenhum vídeo ainda** (`state-empty.png`)
```
[paste the common block above]
SCENE: the robot (neutral, curious face) stands next to a blank retro video screen about its own size: cream #ffecd6 frame, dark blue #203c56 empty screen with a small orange #ffaa5e play triangle in the middle and two empty dashed lines at the bottom where subtitles would be. The robot points at the screen with one arm, inviting.
```

**5.2 Sucesso: legenda pronta** (`state-success.png`)
```
[paste the common block above]
SCENE: the robot with the HAPPY face from Image 2 (eyes as ^ ^), one arm raised, holding up a cream #ffecd6 paper sheet with several rows of navy #0d2b45 dash blocks (abstract text lines, NOT letters). A small orange #ffaa5e check mark badge on the paper's corner and two tiny four-point sparkles around the robot.
```

**5.3 Sem legenda: vídeo sem texto** (`state-no-subs.png`)
```
[paste the common block above]
SCENE: the robot with the SAD face from Image 2, arms down, next to a small retro video screen (cream frame, dark blue screen, orange play triangle) whose subtitle area at the bottom is empty and crossed by a small copper #d08159 "X" shape made of pixels. Gentle, not dramatic.
```

**5.4 Offline: sem internet** (`state-offline.png`)
```
[paste the common block above]
SCENE: the robot with the SLEEPING face from Image 2 (eyes closed, calm), sitting, holding an unplugged cable: the cable end with a small copper #d08159 plug hangs loose next to it, and a disconnected socket floats a bit away. Peaceful, informative, not alarming. Optional: three tiny cream pixel dots above the head to suggest sleep (dots only, NO letter Z).
```

**5.5 IA pensando: resumindo o vídeo** (`state-ai-thinking.png`)
```
[paste the common block above]
SCENE: the robot with the THINKING face from Image 2, hand on chin. Above its head, a cream #ffecd6 thought bubble with square pixel corners containing three orange #ffaa5e square dots (a loading indicator). One tiny four-point sparkle near the bubble.
```

**5.6 Chave/privacidade: "sua chave fica neste aparelho"** (`state-key-privacy.png`)
- **Sem a mascote, de propósito.** O guia de marca pede tom sério em tudo que envolve chave e dinheiro. Um objeto sóbrio passa mais confiança. Aqui **não** anexe a mascote, só a paleta.
```
Image 1 is our palette.
Create a small pixel-art icon illustration: a simple smartphone seen straight-on (slate purple #544e68 body, dark blue #203c56 screen). On the screen, a big cream #ffecd6 padlock with an orange #ffaa5e keyhole. Next to the phone, bottom-right, a small orange #ffaa5e key, overlapping the phone's edge slightly. Calm, trustworthy, simple.
STYLE: authentic 8-bit pixel art on a 64x64 grid shown enlarged: every art pixel an identical, perfectly square block. Hard edges, NO anti-aliasing, NO blur, NO gradients, NO glow, NO soft shadows, flat colors, 1-pixel deep navy #0d2b45 outline. 5 to 7 colors, SLSO8 only: #ffecd6 #ffd4a3 #ffaa5e #d08159 #8d697a #544e68 #203c56 #0d2b45.
COMPOSITION: centered, at least 12% empty margin on every side, no scenery, no floor.
BACKGROUND: transparent (real alpha, RGBA PNG), no checkerboard. NO text, letters, numbers or watermark.
```

### 6. Imagem social / Open Graph (1200×630)
- **Formato:** peça **16:9** em paisagem (ou 3:2 e depois **Resize → 16:9**). A gente recorta para 1200×630 (1,91:1), por isso o prompt deixa margem em cima e embaixo.
- **Anexar:** `bitsub-mascot.png` e a paleta.
- **Recomendação: sem texto na imagem.** A gente escreve o título depois, em código, com a fonte do app (por exemplo "O que o vídeo fala, em texto. Em segundos." + wordmark). Os motivos:
  1. O texto sai com a grafia 100% certa, sem letra inventada.
  2. Dá para gerar versões em **pt-BR, en e es** a partir da mesma arte.
  3. Dá para mudar a frase sem gerar a imagem de novo.
  4. A tipografia fica igual à do site (o layout Swiss depende disso).

```
Image 1 is our mascot (the BitSub robot). Image 2 is our palette.
Create a wide 16:9 social-media banner in Swiss International Style mixed with 8-bit pixel art.
LAYOUT (strict grid, asymmetric):
- Left 58%: a completely plain, flat cream #ffecd6 area with NOTHING in it (we will add the headline later). No texture, no pattern, no shapes.
- Right 42%: a solid deep navy #0d2b45 rectangular block running from top to bottom, with subtle horizontal pixel scanlines in dark blue #203c56.
- Inside the navy block: THIS exact robot from Image 1 (same head, screen face, subtitle-bar mouth, antenna ears, body, colors), large, full body, HAPPY face with one arm waving, standing on nothing. Above its head, a cream speech bubble with square pixel corners containing two rows of navy dash blocks (abstract subtitle lines, NOT letters). Two small four-point pixel sparkles.
- One thin straight orange #ffaa5e vertical rule where the cream and navy areas meet.
- Keep every element at least 12% away from the top and bottom edges (the image will be cropped to 1.91:1).
STYLE: the robot, bubble and sparkles are authentic 8-bit pixel art (square pixel grid, NO anti-aliasing, NO blur, NO gradients, flat colors, 1-pixel navy outline). The layout itself is flat, minimal and geometric: no photos, no 3D, no shadows, no vignette.
PALETTE (SLSO8 only): #ffecd6 #ffd4a3 #ffaa5e #d08159 #8d697a #544e68 #203c56 #0d2b45.
NO text, letters, numbers, logos or watermark anywhere.
```

### 7. Screenshots do PWA: **não gerar**
Os `screenshots` do manifest (a tela de instalação "rica" no Android e no desktop) precisam mostrar **o app de verdade**. Uma imagem inventada pela IA mostra telas que não existem, fica desatualizada no primeiro ajuste de UI e pode enganar quem instala. Eles vão ser capturados do app rodando (celular 1080×1920 e desktop 1920×1080), em `public/screenshots/`, quando as telas estiverem prontas.
