export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / insecure contexts
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadFile(name: string, content: string, mime: string) {
  // BOM so Windows Notepad / Excel read accents correctly in .txt files
  const bom = mime === 'text/plain' ? '﻿' : '';
  const blob = new Blob([bom + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareFile(
  name: string,
  content: string,
  mime: string,
  title: string
): Promise<'shared' | 'unsupported' | 'cancelled'> {
  try {
    const file = new File([content], name, { type: mime === 'application/x-subrip' ? 'text/plain' : mime });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return 'shared';
    }
    return 'unsupported';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] })
    );
  } catch {
    return false;
  }
}
