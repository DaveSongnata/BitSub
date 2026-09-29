# BitSub

**Legendas do YouTube, sem enrolação.** No ar em **https://bitsub.treent.com.br**. Cole um link, leia a legenda na tela, baixe em TXT, TXT com tempo, SRT ou VTT e, se quiser, peça um resumo ou tire dúvidas sobre o vídeo usando a **sua própria IA** (Gemini ou ChatGPT).

Grátis, sem anúncio, sem cadastro e **sem servidor**: tudo acontece no navegador de quem usa. Funciona como app instalável (PWA), em português, inglês e espanhol, nos temas SLSO8 e Original, claro e escuro. É da mesma família do [BitTask](https://bitask.treent.com.br).

---

## O que tem

| | |
|---|---|
| **Colar e pronto** | Aceita qualquer link: `watch?v=`, `youtu.be`, Shorts, lives, embed, links com `t=`/`si=`, texto com link no meio. Colar já busca. |
| **Idioma escolhido antes** | O seletor já vem no idioma do app. Ordem: legenda feita pelo canal → automática do YouTube → tradução automática do YouTube. |
| **Ler antes de baixar** | Texto na tela com busca (ignora acentos), tempos clicáveis que fazem o vídeo pular para o trecho, trecho atual destacado enquanto o vídeo toca, copiar tudo. |
| **4 formatos explicados** | TXT (parágrafos), TXT com tempo (`[02:15] …`), SRT e VTT, com nome de arquivo limpo (`titulo.pt-BR.srt`). |
| **IA com a chave da pessoa** | Gemini (tem cota grátis) ou ChatGPT. Botões prontos (Resumir, Tópicos com tempo, Explicar fácil, Lições práticas, Vale a pena assistir?) + perguntas livres. Resposta em tempo real, com minutos clicáveis. |
| **Tutorial da chave** | Passo a passo + vídeo curtinho no idioma do app (pt/en/es), link direto para criar a chave. |
| **Histórico local** | Vídeos e conversas ficam no aparelho (IndexedDB), abrem até offline. |
| **Colar o texto** | Se o YouTube não entregar a legenda, dá para colar o texto do vídeo e usar tudo igual. |
| **PWA** | Instalável, abre offline, aviso de atualização, recebe links compartilhados do app do YouTube (Android). |

## Como funciona (sem servidor)

```
Navegador (iframe isolado, internet da própria pessoa) ──► YouTube: "quais legendas existem?" ──► endereço assinado da legenda
Navegador ─────────────────────────────────────────────► YouTube: texto da legenda (direto, com o endereço assinado)
Navegador ─────────────────────────────────────────────► Google / OpenAI (direto, com a chave da pessoa)
```

Para baixar a legenda, o YouTube exige um "ingresso": o endereço assinado da legenda, que vem junto da lista de legendas do vídeo. Um site comum não consegue ler essa lista, porque o YouTube só libera essa resposta para páginas do próprio YouTube e do Google.

O BitSub pede a lista de dentro de um **iframe escondido e isolado** (`sandbox="allow-scripts"`, veja `src/lib/youtube/browser-player.ts`). Como o iframe não tem origem, o YouTube responde com `Access-Control-Allow-Origin: null` e a página consegue ler. O pedido vai **sem login** (`credentials: 'omit'`), então só chegam dados públicos. Testado no Chrome, Firefox e Safari (WebKit).

Cada pessoa usa a própria internet, no ritmo de uma pessoa. Não existe um servidor central para o YouTube bloquear, então o app escala com o número de usuários. Se um dia o YouTube mudar esse comportamento, o app mostra um aviso e a opção de colar o texto do vídeo.

O texto da legenda, a chave da IA e as conversas nunca passam por servidor do BitSub (não existe nenhum).

## Publicar na Vercel (grátis)

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório. Ela detecta Vite sozinha (`vercel.json` já configura tudo). Clique em **Deploy**.

É um site estático: não precisa de função, variável de ambiente nem banco de dados.

> Se o domínio mudar, troque o endereço nas linhas `og:url`, `og:image` e `canonical` do `index.html`. É a imagem que aparece quando alguém compartilha o link no WhatsApp ou nas redes, e ela precisa de endereço completo.

A tag `v1.0.0` guarda a versão anterior, que usava uma função de servidor (`/api/tracks`) e um botão de favoritos.

## Rodar no computador

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # gera dist/
npm run preview    # testa o build de produção (com service worker)
npm run test:run   # testes
```

Requer Node 20+.

## Estrutura

```
src/lib/youtube/         links do YouTube, lista de legendas pelo navegador, escolha de faixa, download e leitura
src/lib/transcript.ts    TXT, TXT com tempo, SRT, VTT, texto colado
src/lib/ai.ts            Gemini e OpenAI direto do navegador (streaming + erros amigáveis)
src/lib/prompts.ts       prompts dos botões prontos
src/pages, components    telas (Início, Vídeo, Histórico, Ajustes)
src/i18n/locales         pt-BR, en, es
src/sw.ts                service worker (Workbox)
docs/IMAGE_PROMPTS.md    prompts para gerar logo, ícones e ilustrações no ChatGPT
scripts/art.mjs, og.mjs  geram ícones/favicon/mascote e imagens de compartilhamento
```

## Artes (ícones, mascote, favicon)

As artes originais geradas no ChatGPT ficam em `docs/art-src/` (prompts em `docs/IMAGE_PROMPTS.md`). Para regenerar tudo depois de trocar uma arte:

```bash
npm run art   # limpa e gera ícones, maskable, favicon.ico, mascote e cursores (public/)
npm run og    # refaz as imagens de compartilhamento (pt, en, es)
```

## Manutenção

- **Versões dos clientes do YouTube** ficam em `src/lib/youtube/browser-player.ts` (`CLIENTS`). Se um dia os vídeos pararem de abrir, atualize as versões com as do [yt-dlp](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/youtube/_base.py).
- **Modelos de IA** padrão ficam em `src/lib/ai.ts` (`PROVIDERS`). A lista de modelos do seletor vem da própria API, então modelos novos aparecem sozinhos.
- **Vídeos-tutorial** da chave ficam em `src/lib/tutorials.ts` (todos verificados em 28/09/2026).

## Aviso

O BitSub não tem ligação com o YouTube, o Google ou a OpenAI. Ele só lê legendas públicas, a pedido de quem usa, sem login e sem armazenar nada.

Paleta SLSO8 por Luis Miguel Maldonado. Fonte Press Start 2P por CodeMan38. Instrument Sans por Instrument.
