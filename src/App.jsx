import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { UserProvider } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import Loader from './components/Loader';

// Lazy loading pages
const Login = React.lazy(() => import('./pages/Login'));
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Account = React.lazy(() => import('./pages/Account'));
const Settings = React.lazy(() => import('./pages/Settings'));
const TypingDrill = React.lazy(() => import('./pages/TypingDrill'));
const Lists = React.lazy(() => import('./pages/Lists'));
const ReferenceQuiz = React.lazy(() => import('./pages/ReferenceQuiz'));
const TestModule = React.lazy(() => import('./pages/TestModule'));
const Friends = React.lazy(() => import('./pages/Friends'));
const AppLayout = React.lazy(() => import('./pages/components/AppLayout'));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/welcome/:email", element: <Welcome /> },
      { path: "/welcome", element: <Welcome /> },
      { path: "/typing-drill", element: <TypingDrill /> },
      { path: "/account", element: <Account /> },
      { path: "/settings", element: <Settings /> },
      { path: "/lists", element: <Lists /> },
      { path: "/reference-quiz", element: <ReferenceQuiz /> },
      { path: "/test", element: <TestModule /> },
      { path: "/friends", element: <Friends /> },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} />
        </Suspense>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
