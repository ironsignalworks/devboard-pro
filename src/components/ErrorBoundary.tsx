import React from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error boundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Try reloading the app.
            </p>
            {this.state.message && (
              <p className="text-xs text-muted-foreground">
                {this.state.message}
              </p>
            )}
            <Button onClick={this.handleReload}>Reload</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
