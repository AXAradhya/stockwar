import React from 'react';
import { logToTerminal } from '../../stores/logStore';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null; errorInfo?: React.ErrorInfo | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info);
    this.setState({ errorInfo: info });
    logToTerminal('ERROR', 'ErrorBoundary', `${error.name}: ${error.message}`);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px 24px',
          color: '#e8e8e8',
          background: '#0a0d14',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <div style={{
            maxWidth: 640,
            width: '100%',
            background: '#121620',
            border: '1px solid #ff335544',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff3355', fontSize: 14, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
              <span>▶ SYSTEM RENDER RECOVERY</span>
            </div>
            
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
              An unexpected error occurred
            </div>
            
            <div style={{ fontSize: 12, color: '#8888a0', marginBottom: 16, lineHeight: 1.5 }}>
              The terminal caught an unhandled render exception. You can attempt to recover the session or perform a hard reload.
            </div>

            {this.state.error && (
              <div style={{
                background: '#06080d',
                border: '1px solid #2a1a20',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                color: '#ff6677',
                fontFamily: 'monospace',
                marginBottom: 20,
                wordBreak: 'break-word',
                maxHeight: 180,
                overflowY: 'auto'
              }}>
                <strong>{this.state.error.name}:</strong> {this.state.error.message}
                {this.state.errorInfo?.componentStack && (
                  <pre style={{ marginTop: 8, fontSize: 9, color: '#666680', whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack.slice(0, 400)}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #00ccff, #0088ff)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  letterSpacing: 1
                }}
              >
                TRY RECOVERING SESSION
              </button>
              
              <button
                onClick={this.handleHardReload}
                style={{
                  padding: '10px 16px',
                  background: '#1a1a2e',
                  color: '#aaa',
                  border: '1px solid #333',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: 'pointer',
                  letterSpacing: 1
                }}
              >
                RELOAD PAGE
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

