interface ScoreBadgeProps {
  score: number;
  tier?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, tier, size = "md" }: ScoreBadgeProps) {
  const tierColor = getTierColor(score, tier);
  const tierLabel = tier ?? getTierLabel(score);

  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-14 h-14 text-sm",
    lg: "w-20 h-20 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex flex-col items-center justify-center font-heading font-bold border-2 shrink-0`}
      style={{ borderColor: tierColor, color: tierColor }}
      title={`Score: ${score} — ${tierLabel}`}
    >
      <span>{score}</span>
      <span className="text-[0.5em] font-sans font-normal opacity-75 leading-tight">
        {tierLabel}
      </span>
    </div>
  );
}

export function getTierColor(score: number, tier?: string): string {
  if (tier === "stale") return "var(--color-stale)";
  if (tier === "critical") return "var(--color-critical)";
  if (tier === "watch" || (score >= 40 && score < 70)) return "var(--color-watch)";
  if (tier === "healthy" || score >= 70) return "var(--color-healthy)";
  return "var(--color-critical)";
}

export function getTierLabel(score: number, tier?: string): string {
  if (tier === "stale") return "Stale";
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Watch";
  return "Critical";
}

export function getTierBgClass(score: number, tier?: string): string {
  if (tier === "stale") return "bg-stale/10 text-stale border-stale/20";
  if (tier === "critical" || score < 40) return "bg-critical/10 text-critical border-critical/20";
  if (tier === "watch" || score < 70) return "bg-watch/10 text-watch border-watch/20";
  return "bg-healthy/10 text-healthy border-healthy/20";
}

export function RiskBadge({ score, tier }: { score: number; tier?: string }) {
  const label = tier ?? getTierLabel(score);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTierBgClass(score, tier)}`}
    >
      {label}
    </span>
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}