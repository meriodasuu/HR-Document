import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "./pages/dashboard";
import Employees from "./pages/employees";
import Documents from "./pages/documents";
import CreateDocument from "./pages/create-document";
import DocumentView from "./pages/document-view";
import Templates from "./pages/templates";
import { isAuthenticated, validateCurrentSession } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={Employees} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/new" component={CreateDocument} />
      <Route path="/documents/:id" component={DocumentView} />
      <Route path="/templates" component={Templates} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());

  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated()) {
      validateCurrentSession().then((valid) => {
        if (!cancelled) setAuthed(valid);
      });
    } else {
      setAuthed(false);
    }
    const handler = () => { setAuthed(false); queryClient.clear(); };
    window.addEventListener("hr-logout", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("hr-logout", handler);
    };
  }, []);

  const handleLogin = () => {
    setAuthed(true);
    queryClient.clear();
  };

  const handleLogout = () => {
    setAuthed(false);
    queryClient.clear();
  };

  if (!authed) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
