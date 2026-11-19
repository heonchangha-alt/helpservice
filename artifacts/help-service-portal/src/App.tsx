import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { StoreProvider } from '@/lib/store';
import { AppShell } from '@/components/layout';
import HomePage from '@/pages/home';
import CatalogPage from '@/pages/catalog';
import RequestsPage from '@/pages/requests';
import RequestDetailPage from '@/pages/request-detail';
import WorkspacePage from '@/pages/workspace';
import DashboardPage from '@/pages/dashboard';
import { KnowledgeDetailPage, KnowledgeListPage } from '@/pages/knowledge';
import NotificationsPage from '@/pages/notifications';
import SettingsPage from '@/pages/settings';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/catalog" component={CatalogPage} />
          <Route path="/requests" component={RequestsPage} />
          <Route path="/requests/:id" component={RequestDetailPage} />
          <Route path="/workspace" component={WorkspacePage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/knowledge" component={KnowledgeListPage} />
          <Route path="/knowledge/:id" component={KnowledgeDetailPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
        </StoreProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
