// src/App.tsx

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';

// Pages — lazy loaded for code splitting
const Dashboard       = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Workflows       = React.lazy(() => import('./pages/Workflows').then(m => ({ default: m.Workflows })));
const WorkflowDetail  = React.lazy(() => import('./pages/WorkflowDetail').then(m => ({ default: m.WorkflowDetail })));
const Executions      = React.lazy(() => import('./pages/Executions').then(m => ({ default: m.Executions })));
const ExecutionDetail = React.lazy(() => import('./pages/ExecutionDetail').then(m => ({ default: m.ExecutionDetail })));
const HitlReview      = React.lazy(() => import('./pages/HitlReview').then(m => ({ default: m.HitlReview })));
const Analytics       = React.lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Settings        = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={
              <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
            } />
            <Route path="/workflows" element={
              <Suspense fallback={<PageLoader />}><Workflows /></Suspense>
            } />
            <Route path="/workflows/:id" element={
              <Suspense fallback={<PageLoader />}><WorkflowDetail /></Suspense>
            } />
            <Route path="/executions" element={
              <Suspense fallback={<PageLoader />}><Executions /></Suspense>
            } />
            <Route path="/executions/:id" element={
              <Suspense fallback={<PageLoader />}><ExecutionDetail /></Suspense>
            } />
            <Route path="/hitl" element={
              <Suspense fallback={<PageLoader />}><HitlReview /></Suspense>
            } />
            <Route path="/analytics" element={
              <Suspense fallback={<PageLoader />}><Analytics /></Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<PageLoader />}><Settings /></Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
