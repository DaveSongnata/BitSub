# BitSub

**Legendas do YouTube, sem enrolação.** No ar em **https://bitsub.treent.com.br**. Cole um link, leia a legenda na tela, baixe em TXT, TXT com tempo, SRT ou VTT e, se quiser, peça um resumo ou tire dúvidas sobre o vídeo usando a **sua própria IA** (Gemini ou ChatGPT).

Grátis, sem anúncio, sem cadastro. Funciona como app instalável (PWA), em português, inglês e espanhol, nos temas SLSO8 e Original, claro e escuro. É da mesma família do [BitTask](https://bitask.treent.com.br).

---

## O que tem

| | |
|---|---|
| **Colar e pronto** | Aceita qualquer link: `watch?v=`, `youtu.be`, Shorts, lives, embed, links com `t=`/`si=`, texto com link no meio. Colar já busca. |
| **Idioma escolhido antes** | O seletor já vem no idioma do app. Ordem: legenda feita pelo canal → automática do YouTube → tradução automática do YouTube. |
| **Ler antes de baixar** | Texto na tela com busca (ignora acentos), tempos clicáveis que fazem o vídeo pular para o trecho, copiar tudo. |
| **4 formatos explicados** | TXT (parágrafos), TXT com tempo (`[02:15] …`), SRT e VTT, com nome de arquivo limpo (`titulo.pt-BR.srt`). |
| **IA com a chave da pessoa** | Gemini (tem cota grátis) ou ChatGPT. Botões prontos (Resumir, Tópicos com tempo, Explicar fácil, Lições práticas, Vale a pena assistir?) + perguntas livres. Resposta em tempo real, com minutos clicáveis. |
| **Tutorial da chave** | Passo a passo + vídeo curtinho no idioma do app (pt/en/es), link direto para criar a chave. |
| **Histórico local** | Vídeos e conversas ficam no aparelho (IndexedDB), abrem até offline. |
| **Plano B 100% local** | Se o YouTube recusar o servidor: botão de favoritos que roda no youtube.com, ou colar o texto manualmente. |
| **PWA** | Instalável, abre offline, aviso de atualização, recebe links compartilhados do app do YouTube (Android). |

## Como funciona (e por que tem uma função minúscula)

```
Navegador ──(só o código do vídeo)──► /api/tracks (Vercel Function) ──► YouTube: "quais legendas existem?"
Navegador ◄──── lista de legendas com endereços assinados ────────────┘
Navegador ──────────────────────────────────────────────────────────► YouTube: texto da legenda (direto)
Navegador ──────────────────────────────────────────────────────────► Google / OpenAI (direto, com a chave da pessoa)
```

O YouTube **libera** o download do texto da legenda para qualquer site (CORS), mas **bloqueia** a pergunta "quais legendas esse vídeo tem?" para sites que não são o youtube.com (testado em 12 endereços). Por isso existe uma única função sem estado em `api/tracks.ts`:

- recebe só o código do vídeo, não guarda nada, não registra nada;
- nunca vê o texto da legenda, a chave da IA nem as conversas;
- tenta vários clientes do YouTube (WEB → IOS → ANDROID → MWEB) e fica em cache na CDN por ~5 h por vídeo.

Se o YouTube bloquear o servidor da Vercel, o app oferece o **botão BitSub** (bookmarklet): ele roda dentro do youtube.com, com a conexão da própria pessoa, e entrega a lista para o BitSub. Nenhum servidor envolvido.

## Publicar na Vercel (grátis)

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório. Ela detecta Vite sozinha (`vercel.json` já configura tudo). Clique em **Deploy**.
3. Depois do deploy, confira se o YouTube responde para o servidor:
   `https://bitsub.treent.com.br/api/tracks?v=dQw4w9WgXcQ&diag=1`
   Algum cliente com `"result": "ok"` = tudo certo. Se todos vierem `"blocked"`, troque a região da função (Settings → Functions → Function Region, ex.: `gru1` São Paulo ou `cdg1` Paris), faça redeploy e teste de novo. Mesmo bloqueado, o plano B (botão de favoritos e colar texto) continua funcionando.

Não precisa de variável de ambiente nem de banco de dados.

> Se o domínio mudar, troque o endereço nas linhas `og:url`, `og:image` e `canonical` do `index.html`. É a imagem que aparece quando alguém compartilha o link no WhatsApp ou nas redes, e ela precisa de endereço completo.

## Rodar no computador

```bash
npm install
npm run dev        # http://localhost:3000 (a função /api roda junto)
npm run build      # gera dist/
npm run preview    # testa o build de produção (com service worker)
npm run test:run   # testes
```

Requer Node 20+.

## Estrutura

```
api/tracks.ts            função da Vercel (lista de legendas)
api/_lib/innertube.ts    clientes do YouTube + diagnóstico
src/lib/youtube/         links do YouTube, escolha de faixa, download e leitura (json3/srv3)
src/lib/transcript.ts    TXT, TXT com tempo, SRT, VTT, texto colado
src/lib/ai.ts            Gemini e OpenAI direto do navegador (streaming + erros amigáveis)
src/lib/prompts.ts       prompts dos botões prontos
src/lib/bookmarklet.ts   plano B (botão de favoritos)
src/pages, components    telas (Início, Vídeo, Histórico, Ajustes)
src/i18n/locales         pt-BR, en, es
src/sw.ts                service worker (Workbox)
docs/IMAGE_PROMPTS.md    prompts para gerar logo, ícones e ilustrações no ChatGPT
scripts/art.mjs, og.mjs    geram ícones/favicon/mascote e imagens de compartilhamento
```

## Artes (ícones, mascote, favicon)

As artes originais geradas no ChatGPT ficam em `docs/art-src/` (prompts em `docs/IMAGE_PROMPTS.md`). Para regenerar tudo depois de trocar uma arte:

```bash
npm run art   # limpa e gera ícones, maskable, favicon.ico e mascote (public/)
npm run og    # refaz as imagens de compartilhamento (pt, en, es)
```
## Manutenção

- **Versões dos clientes do YouTube** ficam em `api/_lib/innertube.ts` (`CLIENTS`). Se um dia `diag=1` mostrar tudo falhando, atualize as versões com as do [yt-dlp](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/youtube/_base.py).
- **Modelos de IA** padrão ficam em `src/lib/ai.ts` (`PROVIDERS`). A lista de modelos do seletor vem da própria API, então modelos novos aparecem sozinhos.
- **Vídeos-tutorial** da chave ficam em `src/lib/tutorials.ts` (todos verificados em 28/09/2026).

## Aviso

O BitSub não tem ligação com o YouTube, o Google ou a OpenAI. Ele só lê legendas públicas, a pedido de quem usa, sem armazenar nada.

Paleta SLSO8 por Luis Miguel Maldonado. Fonte Press Start 2P por CodeMan38. Instrument Sans por Instrument.
