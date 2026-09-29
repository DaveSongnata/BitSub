import { memo, useMemo, type MouseEvent } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { seek } from '@/lib/player';

marked.setOptions({ gfm: true, breaks: false });

// Links from the AI open in a new tab and never leak the page (the transcript could try tricks).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

const PURIFY = {
  ADD_ATTR: ['data-t', 'type', 'target'],
  // No remote loads (a hidden image could leak the conversation), no forms.
  FORBID_TAGS: [
    'img',
    'picture',
    'source',
    'video',
    'audio',
    'iframe',
    'form',
    'input',
    'textarea',
    'select',
    'style',
    'svg',
    'math',
  ],
  FORBID_ATTR: ['style', 'srcset'],
};

// [12:34], [1:02:03] and groups like [11:37, 13:13] or [05:31 – 06:10] → one clickable button per time
const TIME = String.raw`\d{1,2}:\d{2}(?::\d{2})?`;
const TS_RE = new RegExp(String.raw`\[(${TIME}(?:\s*(?:[,;–-]|e|and|y)\s*${TIME})*)\]`, 'g');
const ONE_TIME = new RegExp(TIME, 'g');

function toSeconds(ts: string): number {
  return ts
    .split(':')
    .map(Number)
    .reduce((a, n) => a * 60 + n, 0);
}

function render(md: string, linkTimes: boolean): string {
  const html = marked.parse(md, { async: false });
  const withTimes = linkTimes
    ? html.replace(TS_RE, (_m, group: string) =>
        group.replace(ONE_TIME, (ts) => `<button type="button" class="ts-link" data-t="${toSeconds(ts)}">${ts}</button>`)
      )
    : html;
  return DOMPurify.sanitize(withTimes, PURIFY);
}

export const Markdown = memo(function Markdown({ text, linkTimes = true }: { text: string; linkTimes?: boolean }) {
  const html = useMemo(() => render(text, linkTimes), [text, linkTimes]);
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-t]');
    if (target?.dataset.t) {
      e.preventDefault();
      seek(Number(target.dataset.t));
    }
  };
  return <div className="prose-bs" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
});
