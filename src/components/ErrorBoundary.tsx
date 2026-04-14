import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<any, any> {
  state: any = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { children } = (this as any).props;
    const { hasError, error } = (this as any).state;
    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-red-50">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Đã có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">
            {error?.message.startsWith('{') 
              ? "Lỗi hệ thống Firestore. Vui lòng thử lại sau." 
              : error?.message || "Vui lòng tải lại trang."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Tải lại trang
          </button>
          {error?.message.startsWith('{') && (
            <pre className="mt-8 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-w-full">
              {JSON.stringify(JSON.parse(error.message), null, 2)}
            </pre>
          )}
        </div>
      );
    }

    return children;
  }
}
