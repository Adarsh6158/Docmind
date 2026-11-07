import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[#09090b] flex items-center justify-center p-4 text-zinc-100">
          <div className="max-w-md w-full bg-[#121215] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="size-11 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="size-5" strokeWidth={1.75} />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Application Encountered an Error</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An unexpected state occurred. You can reload the application or return to home.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-zinc-950 border border-white/[0.06] rounded-xl p-3 text-left">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2.5 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] text-xs font-medium rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Reload</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition border border-white/[0.08] cursor-pointer"
              >
                <Home className="size-3.5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
