import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 m-4">
          <h2 className="text-xl font-bold text-red-300 mb-4">Something went wrong</h2>
          <p className="text-red-200 mb-4">The wallet analysis encountered an error.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;