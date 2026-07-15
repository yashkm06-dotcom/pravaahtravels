import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL RUNTIME ERROR] Uncaught error inside React tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-xl p-8 shadow-md text-center space-y-6">
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-serif font-bold text-stone-850">Something went wrong</h1>
              <p className="text-xs text-stone-500 leading-relaxed">
                An unexpected system error occurred while rendering this mountain view. Don't worry, your data and bookings are completely safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-stone-50 border border-stone-200 rounded p-4 text-left font-mono text-[10px] text-stone-600 max-h-40 overflow-auto whitespace-pre-wrap">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Go to Home Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
