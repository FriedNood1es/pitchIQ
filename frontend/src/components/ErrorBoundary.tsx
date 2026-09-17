import { Component, ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * A render crash in one view becomes a readable card instead of a blank
 * page (an uncaught sidebar crash once blanked the whole landing). One
 * boundary per view, so a broken compare never takes down fixtures —
 * switching views unmounts the boundary and clears the error.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="tl-card p-5 text-sm" role="alert">
          <p className="font-bold text-[var(--text)]">
            Something broke in the {this.props.name} view
          </p>
          <p className="mt-1 break-words text-[var(--muted)]">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="mt-3 rounded-[10px] px-3 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
