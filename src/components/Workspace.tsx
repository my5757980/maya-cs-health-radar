import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Account, HealthSnapshot, HealthTier } from "../lib/types";
import { ScoreBadge, getTierColor, getTierLabel, timeAgo, RiskBadge } from "./ScoreBadge";
import { AddSignalModal } from "./AddSignalModal";

interface AccountRow {
  account: Account;
  snapshot: HealthSnapshot | null;
  tier: HealthTier;
}

export function Workspace() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<HealthTier | "all">("all");
  const [showAddSignal, setShowAddSignal] = useState(false);

  const loadAccounts = async () => {
    try {
      const { data: accts } = await supabase
        .from("accounts")
        .select("*")
        .order("name");

      if (!accts) {
        setAccounts([]);
        return;
      }

      // Get latest health snapshot per account
      const { data: snapshots } = await supabase
        .from("health_snapshots")
        .select("*")
        .order("created_at", { ascending: false });

      const snapshotMap = new Map<string, HealthSnapshot>();
      for (const s of snapshots ?? []) {
        if (!snapshotMap.has(s.account_id)) {
          snapshotMap.set(s.account_id, s);
        }
      }

      const rows: AccountRow[] = accts.map((a) => {
        const snapshot = snapshotMap.get(a.id) ?? null;
        const tier: HealthTier = snapshot?.tier ?? "stale";
        return { account: a, snapshot, tier };
      });

      // Sort: highest risk first (critical → watch → stale → healthy)
      const riskOrder: Record<HealthTier, number> = {
        critical: 0,
        watch: 1,
        stale: 2,
        healthy: 3,
      };
      rows.sort((a, b) => riskOrder[a.tier] - riskOrder[b.tier]);

      setAccounts(rows);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filtered = useMemo(() => {
    return accounts.filter((r) => {
      const matchesSearch =
        !search ||
        r.account.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.account.industry ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesTier = filterTier === "all" || r.tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [accounts, search, filterTier]);

  const handleSignalAdded = () => {
    setShowAddSignal(false);
    loadAccounts();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Workspace
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            {accounts.length} accounts ·{" "}
            {accounts.filter((a) => a.tier === "critical" || a.tier === "watch").length} need attention
          </p>
        </div>
        <button
          onClick={() => setShowAddSignal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-150 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Signal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-150 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "watch", "healthy", "stale"] as const).map(
            (tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                  filterTier === tier
                    ? tier === "all"
                      ? "bg-primary text-on-primary border-primary"
                      : `border-current ${getTierColor(
                          tier === "healthy" ? 80 : tier === "watch" ? 50 : 20,
                          tier
                        )} bg-current/10`
                    : "bg-white text-foreground/60 border-border hover:border-foreground/20"
                }`}
              >
                {tier === "all" ? "All" : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-foreground/20 mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground/60 mb-1">
            {search || filterTier !== "all"
              ? "No accounts match your filters"
              : "No accounts yet"}
          </h3>
          <p className="text-sm text-foreground/40 max-w-sm">
            {search || filterTier !== "all"
              ? "Try a different search term or filter."
              : "Add some seed data or the first signal to get started."}
          </p>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-3">
        {filtered.map((row) => (
          <Link
            key={row.account.id}
            to={`/account/${row.account.id}`}
            className="block bg-white rounded-xl border border-border p-4 sm:p-5 hover:shadow-md hover:border-foreground/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <ScoreBadge
                score={row.snapshot?.score ?? 0}
                tier={row.tier}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-heading font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-150">
                    {row.account.name}
                  </h3>
                  <RiskBadge score={row.snapshot?.score ?? 0} tier={row.tier} />
                </div>
                {row.account.industry && (
                  <p className="text-xs text-foreground/40 mt-0.5">
                    {row.account.industry}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {row.snapshot ? (
                  <p className="text-xs text-foreground/40">
                    Updated {timeAgo(row.snapshot.created_at)}
                  </p>
                ) : (
                  <p className="text-xs text-foreground/40">No data</p>
                )}
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getTierColor(
                        row.snapshot?.score ?? 0,
                        row.tier
                      ),
                    }}
                  />
                  <span className="text-xs font-medium text-foreground/50">
                    {getTierLabel(row.snapshot?.score ?? 0, row.tier)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Add Signal Modal */}
      {showAddSignal && (
        <AddSignalModal
          accounts={accounts.map((r) => r.account)}
          onClose={() => setShowAddSignal(false)}
          onSignalAdded={handleSignalAdded}
        />
      )}
    </div>
  );
}