import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Account, SignalType, Severity } from "../lib/types";

interface Props {
  accounts: Account[];
  onClose: () => void;
  onSignalAdded: () => void;
}

const SIGNAL_TYPES: { value: SignalType; label: string }[] = [
  { value: "support_ticket", label: "Support Ticket" },
  { value: "usage_drop", label: "Usage Drop" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "nps_response", label: "NPS Response" },
  { value: "feature_adoption", label: "Feature Adoption" },
  { value: "manual_note", label: "Manual Note" },
];

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function AddSignalModal({ accounts, onClose, onSignalAdded }: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [type, setType] = useState<SignalType>("support_ticket");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showSeverity = type === "support_ticket";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    setSubmitting(true);
    setError(null);

    try {
      // Build details payload
      const detailsPayload: Record<string, unknown> = {};
      if (type === "support_ticket") {
        detailsPayload.description = details;
      } else if (type === "manual_note") {
        detailsPayload.note = details;
      } else if (type === "nps_response") {
        detailsPayload.response = details;
      } else if (type === "usage_drop") {
        detailsPayload.notes = details;
      } else if (type === "payment_issue") {
        detailsPayload.notes = details;
      } else if (type === "feature_adoption") {
        detailsPayload.notes = details;
      }

      const { error: insertError } = await supabase.from("signals").insert({
        account_id: accountId,
        type,
        severity: showSeverity ? severity : null,
        details: detailsPayload,
        recorded_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setSuccess(true);

      // Trigger recalculate
      try {
        await supabase.functions.invoke("recalculate-health", {
          body: { account_id: accountId },
        });
      } catch {
        // Recalculation failure is non-critical — signal was saved
      }

      setTimeout(() => {
        onSignalAdded();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add signal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {success ? "Signal Added" : "Add Signal"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-150 cursor-pointer"
          >
            <X className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-healthy/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-healthy text-2xl">✓</span>
            </div>
            <p className="text-sm text-foreground/70">
              Signal recorded and health score recalculated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Account */}
            <div>
              <label className="block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-150 outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Signal Type */}
            <div>
              <label className="block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider">
                Signal Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SignalType)}
                required
                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-150 outline-none"
              >
                {SIGNAL_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity (only for support_ticket) */}
            {showSeverity && (
              <div>
                <label className="block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-150 outline-none"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Details */}
            <div>
              <label className="block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider">
                Details
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  type === "support_ticket"
                    ? "Describe the support issue..."
                    : type === "manual_note"
                    ? "Enter your note..."
                    : type === "nps_response"
                    ? "Enter NPS response details..."
                    : "Enter details..."
                }
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-150 outline-none resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground/60 hover:bg-muted transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !accountId}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-[0.97]"
              >
                {submitting ? "Saving..." : "Add Signal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}