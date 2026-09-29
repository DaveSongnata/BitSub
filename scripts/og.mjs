/**
 * Social preview images (1200×630) in pt-BR, en and es.
 *   node scripts/og.mjs
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const font = readFileSync('node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2').toString('base64');
const pixel = readFileSync('node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2').toString('base64');
const icon = readFileSync('public/illustrations/mascot.png').toString('base64');

const COPY = {
  'pt-BR': { h: 'O que o vídeo fala, em texto.', a: 'Em segundos.', s: 'Legendas do YouTube em TXT, com tempo ou SRT. Resumo com a sua IA.', b: 'Grátis · Sem anúncio · Sem cadastro' },
  en: { h: 'What the video says, as text.', a: 'In seconds.', s: 'YouTube subtitles as TXT, with time or SRT. Summaries with your own AI.', b: 'Free · No ads · No sign-up' },
  es: { h: 'Lo que dice el video, en texto.', a: 'En segundos.', s: 'Subtítulos de YouTube en TXT, con tiempo o SRT. Resumen con tu propia IA.', b: 'Gratis · Sin anuncios · Sin registro' },
};

const html = (c) => `<!doctype html><html><head><style>
@font-face{font-family:IS;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
@font-face{font-family:PX;src:url(data:font/woff2;base64,${pixel}) format('woff2')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#ffecd6;color:#0d2b45;font-family:IS;display:grid;grid-template-columns:700px 500px;overflow:hidden}
.l{padding:64px 56px;display:flex;flex-direction:column;justify-content:space-between}
.logo{font-family:PX;font-size:30px}.logo span{color:#d08159}
h1{font-size:68px;line-height:1.02;letter-spacing:-.035em;font-weight:620}
.acc{position:relative;display:inline-block}.acc:after{content:'';position:absolute;left:-4px;right:-4px;bottom:6px;height:22px;background:#ffaa5e;z-index:-1}
p{font-size:25px;line-height:1.35;color:#544e68;margin-top:22px}
.tag{display:inline-block;border:3px solid #0d2b45;padding:8px 12px;font-weight:650;font-size:17px;letter-spacing:.07em;text-transform:uppercase}
.r{background:#ffd4a3;border-left:4px solid #0d2b45;display:flex;align-items:center;justify-content:center;position:relative}
.r img{width:340px;image-rendering:pixelated}
</style></head><body><div class="l"><div class="logo">Bit<span>Sub</span></div><div><h1>${c.h} <span class="acc">${c.a}</span></h1><p>${c.s}</p></div><div><span class="tag">${c.b}</span></div></div>
<div class="r"><img src="data:image/png;base64,${icon}"></div></body></html>`;

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [lang, c] of Object.entries(COPY)) {
  await page.setContent(html(c));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/og/og-${lang}.png` });
  console.log('wrote', lang);
}
await browser.close();
