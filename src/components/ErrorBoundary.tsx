/**
 * ErrorBoundary — перехватчик React-ошибок (crash recovery)
 *
 * Без Error Boundary любая ошибка в React-дереве = белый экран без объяснения.
 * С Error Boundary: показываем сообщение об ошибке + кнопку перезагрузки.
 *
 * Использование:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const info = errorInfo.componentStack || '';
    this.setState({ errorInfo: info });
    // Логируем в консоль для отладки
    console.error('[ErrorBoundary] React crash:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#1a2332',
          color: '#ccc',
          fontFamily: 'Tahoma, Arial, sans-serif',
          padding: 20,
        }}>
          <div style={{
            background: '#243447',
            border: '1px solid #cc4b37',
            borderRadius: 6,
            padding: '24px 32px',
            maxWidth: 600,
            width: '100%',
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#cc4b37', marginBottom: 12 }}>
              ⚠ Ошибка приложения
            </div>
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
              {this.state.error?.message || 'Неизвестная ошибка'}
            </div>
            {this.state.errorInfo && (
              <pre style={{
                fontSize: 11,
                color: '#888',
                background: '#1a2332',
                padding: 10,
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}>
                {this.state.errorInfo}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#157fcc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 20px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Перезагрузить
              </button>
              <button
                onClick={this.handleClearAndReload}
                style={{
                  background: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 20px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Очистить кэш и перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
