import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-lg text-foreground">
            Maya
          </span>
          <span className="hidden sm:inline text-xs text-foreground/40 font-medium ml-1">
            CS Health Radar
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors duration-150"
          >
            Workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}