import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Diagnostics from "@/pages/Diagnostics";
import NotFound from "@/pages/not-found";
import { MobileOptimization } from "@/components/MobileOptimization";

// Import specific styles for mobile
import "@/styles/mobile-optimization.css";
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileOptimization />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
