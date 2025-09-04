import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { errorMonitoringService } from '@/services/errorMonitoringService';
import { environmentService } from '@/services/environmentService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null,
    errorMessage: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorId: `error_${Date.now()}`,
      errorMessage: error.message
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send error to monitoring service
    errorMonitoringService.captureError({
      error_type: 'react_error_boundary',
      error_message: error.message,
      stack_trace: error.stack,
      severity: 'critical',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'MainErrorBoundary'
      }
    });

    // Dispatch custom event for global error handler
    window.dispatchEvent(new CustomEvent('react-error', {
      detail: { error, errorInfo, errorBoundary: 'MainErrorBoundary' }
    }));

    // Log in development
    if (environmentService.env.enableLogging) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      errorId: null,
      errorMessage: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportIssue = () => {
    // In a real app, this could open a support ticket or feedback form
    const mailtoLink = `mailto:support@pilllens.app?subject=Error Report ${this.state.errorId}&body=Error Message: ${this.state.errorMessage}%0D%0ATime: ${new Date().toISOString()}`;
    window.open(mailtoLink, '_blank');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-destructive/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We're sorry, but an unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {environmentService.env.enableLogging && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Error ID:</p>
                  <p className="text-xs font-mono text-foreground">{this.state.errorId}</p>
                  {this.state.errorMessage && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mb-1 mt-2">Message:</p>
                      <p className="text-xs text-foreground">{this.state.errorMessage}</p>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload} 
                  variant="outline" 
                  className="w-full"
                >
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleReportIssue} 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                >
                  Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}