import { Component, type ReactNode } from 'react';

type Props = { children?: ReactNode; render?: () => ReactNode; onError: (error: Error) => void; onRetry?: () => void; fallback: (retry: () => void) => ReactNode };
// JSX arguments are evaluated in their caller, before a boundary can see them.
// Evaluate the page presentation in a descendant, keeping its combat owner alive.
function GamePresentation({ render }: { render: () => ReactNode }) { return render(); }
// The owner of combat state stays mounted. A child rendering error replaces
// the scene with a recoverable pause, without navigating or starting a new run.
export default class GameSceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  retry = () => { this.props.onRetry?.(); this.setState({ failed: false }); };
  render() {
    return this.state.failed ? this.props.fallback(this.retry)
      : this.props.render ? <GamePresentation render={this.props.render} /> : this.props.children;
  }
}
