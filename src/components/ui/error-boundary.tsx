'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-[hsl(0,0%,90%)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[hsl(0,0%,50%)] mb-4 max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-[hsl(221,83%,53%)] text-white rounded-lg text-sm hover:bg-[hsl(221,83%,45%)] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
