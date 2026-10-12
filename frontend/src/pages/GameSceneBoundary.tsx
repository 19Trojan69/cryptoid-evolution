import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; onError: (error: Error) => void; fallback: (retry: () => void) => ReactNode };
// The owner of combat state stays mounted. A child rendering error replaces
// the scene with a recoverable pause, without navigating or starting a new run.
export default class GameSceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}
