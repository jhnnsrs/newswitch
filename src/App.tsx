import "./App.css";
import type { ReactNode } from "react";
import { Activity, PlaySquare } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { buttonVariants } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { cn } from "./lib/utils";
import { IndexPage, ReplayPage } from "./pages";
import { StoreProvider } from "./store";
import { TransportProvider } from "./transport";

// The backend API URL is either injected into the global scope by the
// electron app or taken from environment variables, allowing for flexibility in different deployment scenarios.
const BACKEND_API = window.__agent_url__ || import.meta.env.VITE_BACKEND_URL;
const BACKEND_WS =
  window.__agent_ws_url__ || import.meta.env.VITE_WEBSOCKET_URL;

function ScopedRoute({
  children,
  scope,
}: {
  children: ReactNode;
  scope: string;
}) {
  return (
    <StoreProvider scope={scope}>
      <TransportProvider
        config={{
          instanceId: `microscope-control-panel-${scope}`,
          apiEndpoint: BACKEND_API,
          wsEndpoint: BACKEND_WS,
        }}
      >
        {children}
      </TransportProvider>
    </StoreProvider>
  );
}

function AppNavigation() {
  const items = [
    {
      to: "/",
      label: "Index",
      icon: Activity,
    },
    {
      to: "/replay",
      label: "Replay",
      icon: PlaySquare,
    },
  ];

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 -translate-y-1/2">
      <div className="pointer-events-auto flex flex-row items-center gap-2 rounded-2xl border border-border bg-background/85 p-2 shadow-lg backdrop-blur-sm dark">
        {items.map(({ to, label, icon: Icon }) => (
          <Tooltip key={to}>
            <TooltipTrigger asChild>
              <NavLink
                to={to}
                end={to === "/"}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({
                      variant: isActive ? "default" : "ghost",
                      size: "icon",
                    }),
                    "rounded-xl",
                  )
                }
              >
                <Icon className="size-4" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <AppNavigation />
      <Routes>
        <Route
          path="/"
          element={
            <ScopedRoute scope="index">
              <IndexPage />
            </ScopedRoute>
          }
        />
        <Route
          path="/replay"
          element={
            <ScopedRoute scope="replay">
              <ReplayPage />
            </ScopedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default App;
