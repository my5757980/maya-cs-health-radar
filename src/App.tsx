import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Header } from "./components/Header";
import { Workspace } from "./components/Workspace";
import { AccountDetail } from "./components/AccountDetail";

const DEMO_USER_EMAIL = "maya@example.com";
const DEMO_USER_PASSWORD = "demo-password-maya-2025";

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .signInWithPassword({
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
      })
      .then(({ error: signInError }) => {
        if (signInError) {
          return supabase.auth.signInAnonymously();
        }
        return null;
      })
      .then((anonResult) => {
        if (anonResult?.error) {
          console.warn("Anonymous sign-in also failed:", anonResult.error.message);
        }
        setReady(true);
      })
      .catch((err) => {
        console.error("Auth error:", err);
        setError(err instanceof Error ? err.message : "Failed to sign in");
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3 animate-pulse-soft">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-foreground/60 font-medium">Connecting to Maya...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-heading font-semibold text-destructive mb-2">
            Connection Error
          </h2>
          <p className="text-sm text-foreground/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Workspace />} />
            <Route path="/account/:id" element={<AccountDetail />} />
            <Route path="/account/:id/" element={<AccountDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}