import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#fff', background: '#12090a' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>An unexpected error occurred</div>
          <div style={{ fontSize: 12, color: '#ccc' }}>Please reload the page or open Settings to report the issue.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
