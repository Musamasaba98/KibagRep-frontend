import { useEffect, useState } from "react";
import { LuTrendingUp, LuClipboardList, LuMapPin, LuTriangleAlert, LuPencil, LuCheck, LuX } from "react-icons/lu";
import { BsGraphUp } from "react-icons/bs";
import { MdOutlinePendingActions } from "react-icons/md";
import { getTeamPerformanceApi, getProductPricesApi, updateProductPriceApi } from "../../../services/api";

interface RepPerformance {
  user: { id: string; firstname: string; lastname: string };
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  cycle_adherence_pct: number | null;
  days_since_last_visit: number | null;
  gps_anomaly_count_week: number;
  pending_reports: number;
}

const getInitials = (firstname: string, lastname: string) =>
  `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();

const cycleBg = (pct: number | null): string => {
  if (pct == null) return "bg-gray-100 text-gray-500";
  if (pct >= 80) return "bg-[#dcfce7] text-[#16a34a]";
  if (pct >= 50) return "bg-amber-50 text-amber-600";
  return "bg-red-50 text-red-600";
};

interface ProductPrice {
  id: string;
  product_name: string;
  unit_price: number;
  pending_unit_price: number | null;
  price_proposed_by: string | null;
}

// ─── Product price row (manager can propose price) ────────────────────────────
const ProductPriceRow = ({
  product, onPropose,
}: {
  product: ProductPrice;
  onPropose: (id: string, price: number) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setPrice(product.pending_unit_price ?? product.unit_price);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    await onPropose(product.id, price);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-50 last:border-0">
      <div className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
      <span className="text-sm font-medium text-[#1a1a1a] flex-1 min-w-0 truncate">{product.product_name}</span>

      {/* Active price */}
      <span className="text-xs text-gray-400 shrink-0">
        Active: <span className="font-semibold text-[#1a1a1a]">
          {product.unit_price > 0 ? `UGX ${product.unit_price.toLocaleString()}` : "—"}
        </span>
      </span>

      {/* Pending badge */}
      {product.pending_unit_price != null && !editing && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
          <MdOutlinePendingActions className="w-3 h-3" />
          UGX {product.pending_unit_price.toLocaleString()} pending CM approval
        </span>
      )}

      {editing ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-400">UGX</span>
          <input
            type="number" min={0} value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-28 text-right text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]"
            autoFocus
          />
          <button onClick={save} disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
            style={{ transition: "background-color 0.15s" }}>
            {saving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <LuCheck className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setEditing(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            style={{ transition: "background-color 0.15s" }}>
            <LuX className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={startEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-[#16a34a] rounded-lg border border-gray-200 hover:border-[#16a34a] hover:bg-[#f0fdf4] shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s, border-color 0.15s, color 0.15s" }}>
          <LuPencil className="w-3 h-3" />
          Propose
        </button>
      )}
    </div>
  );
};

const Analytics = () => {
  const [reps, setReps] = useState<RepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [products, setProducts] = useState<ProductPrice[]>([]);

  useEffect(() => {
    getTeamPerformanceApi()
      .then((res) => {
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setReps(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    getProductPricesApi()
      .then((res) => setProducts(res.data?.data ?? []))
      .catch(() => {});
  }, []);

  const handlePropose = async (productId: string, price: number) => {
    await updateProductPriceApi(productId, price);
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, pending_unit_price: price, price_proposed_by: "me" } : p
    ));
  };

  // ── Derived KPIs ─────────────────────────────────────────────────────────────
  const totalVisitsMonth = reps.reduce((s, r) => s + (r.visits_this_month ?? 0), 0);

  const adherenceValues = reps
    .map((r) => r.cycle_adherence_pct)
    .filter((v): v is number => v != null);
  const avgAdherence =
    adherenceValues.length > 0
      ? Math.round(adherenceValues.reduce((s, v) => s + v, 0) / adherenceValues.length)
      : null;

  const totalGpsAnomalies = reps.reduce((s, r) => s + (r.gps_anomaly_count_week ?? 0), 0);
  const totalPendingReports = reps.reduce((s, r) => s + (r.pending_reports ?? 0), 0);

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  const leaderboard = [...reps].sort(
    (a, b) => (b.visits_this_month ?? 0) - (a.visits_this_month ?? 0)
  );

  // ── Attention list ───────────────────────────────────────────────────────────
  const attentionReps = reps.filter(
    (r) =>
      (r.gps_anomaly_count_week ?? 0) > 0 ||
      (r.days_since_last_visit != null && r.days_since_last_visit > 3) ||
      (r.pending_reports ?? 0) > 0
  );

  const kpiCards = [
    {
      label: "Team Visits This Month",
      value: loading ? "—" : totalVisitsMonth,
      sub: "Across all reps",
      icon: LuTrendingUp,
    },
    {
      label: "Avg Cycle Adherence",
      value: loading ? "—" : avgAdherence != null ? `${avgAdherence}%` : "N/A",
      sub: "Non-null reps averaged",
      icon: BsGraphUp,
    },
    {
      label: "GPS Anomalies This Week",
      value: loading ? "—" : totalGpsAnomalies,
      sub: "Flagged location events",
      icon: LuMapPin,
    },
    {
      label: "Pending Reports",
      value: loading ? "—" : totalPendingReports,
      sub: "Awaiting review",
      icon: LuClipboardList,
    },
  ];

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Company-wide KPI analytics</p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-gray-400">Loading analytics…</span>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-red-400 text-sm">Failed to load analytics. Please try again.</p>
        </div>
      )}

      {!loading && !error && reps.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex items-center justify-center py-16">
          <p className="text-gray-400 text-sm">No rep data available.</p>
        </div>
      )}

      {!loading && !error && reps.length > 0 && (<>
      {/* ── Section 1: KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-l-4 border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] px-5 py-5 flex items-start justify-between gap-3"
            style={{ borderLeftColor: "#16a34a" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-black text-[#1a1a1a] leading-none">{value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-2 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#16a34a]" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2: Rep Leaderboard ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Rep Leaderboard</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ranked by visits this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 w-12">#</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Rep</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Month</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Week</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Cycle %</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">GPS Flags</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaderboard.map((rep, idx) => {
                const isInactive =
                  rep.days_since_last_visit != null && rep.days_since_last_visit > 3;
                return (
                  <tr
                    key={rep.user.id}
                    className="hover:bg-gray-50/60"
                    style={{ transition: "background-color 0.15s" }}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                          <span className="text-[#16a34a] font-black text-xs">
                            {getInitials(rep.user.firstname, rep.user.lastname)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1a1a]">
                            {rep.user.firstname} {rep.user.lastname}
                          </p>
                          {isInactive && (
                            <span className="inline-block text-[10px] font-bold bg-red-50 text-red-500 rounded-full px-2 py-0.5 mt-0.5 leading-none">
                              Inactive {rep.days_since_last_visit}d
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-[#1a1a1a]">
                      {rep.visits_this_month ?? 0}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {rep.visits_this_week ?? 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${cycleBg(rep.cycle_adherence_pct)}`}>
                        {rep.cycle_adherence_pct != null ? `${rep.cycle_adherence_pct}%` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          (rep.gps_anomaly_count_week ?? 0) > 0 ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {rep.gps_anomaly_count_week ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          (rep.pending_reports ?? 0) > 0 ? "text-amber-500" : "text-gray-400"
                        }`}
                      >
                        {rep.pending_reports ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Attention Required ──────────────────────────────────── */}
      {attentionReps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <LuTriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Attention Required</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {attentionReps.length} rep{attentionReps.length !== 1 ? "s" : ""} flagged
              </p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attentionReps.map((rep) => {
              const alerts: { label: string; level: "red" | "amber" }[] = [];
              if ((rep.gps_anomaly_count_week ?? 0) > 0)
                alerts.push({ label: `${rep.gps_anomaly_count_week} GPS anomal${rep.gps_anomaly_count_week === 1 ? "y" : "ies"} this week`, level: "red" });
              if (rep.days_since_last_visit != null && rep.days_since_last_visit > 3)
                alerts.push({ label: `No visit in ${rep.days_since_last_visit} days`, level: "red" });
              if ((rep.pending_reports ?? 0) > 0)
                alerts.push({ label: `${rep.pending_reports} pending report${rep.pending_reports === 1 ? "" : "s"}`, level: "amber" });

              return (
                <div
                  key={rep.user.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#16a34a] font-black text-xs">
                      {getInitials(rep.user.firstname, rep.user.lastname)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm truncate">
                      {rep.user.firstname} {rep.user.lastname}
                    </p>
                    <div className="flex flex-col gap-1 mt-1.5">
                      {alerts.map((alert, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            alert.level === "red" ? "text-red-500" : "text-amber-600"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                              alert.level === "red" ? "bg-red-500" : "bg-amber-400"
                            }`}
                          />
                          {alert.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>)}

      {/* ── Product Prices (always visible if products loaded) ──────────────── */}
      {products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Product Prices</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Propose a price — Country Manager approval required before it goes live.
            </p>
          </div>
          {products.map(p => (
            <ProductPriceRow key={p.id} product={p} onPropose={handlePropose} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;
