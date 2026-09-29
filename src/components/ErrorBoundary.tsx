import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';
import { Mascot } from './Mascot';

/** Last line of defense: a friendly screen with a reload button instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-start justify-center gap-5 px-4 py-16 sm:px-6">
        <Mascot size={96} />
        <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.02em]">{t('errors.unknown')}</h1>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </button>
      </main>
    );
  }
}
