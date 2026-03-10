import { useEffect, useState } from "react";
import { FaUserGroup, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { IoCalendarOutline, IoMegaphoneOutline } from "react-icons/io5";
import { LuReceiptText, LuShield } from "react-icons/lu";
import { MdOutlineWarningAmber, MdOutlineGpsOff } from "react-icons/md";
import { format } from "date-fns";
import {
  getCompanyFeedApi,
  getPendingReportsApi,
} from "../../../services/api";

interface RepSummary {
  user: { id: string; firstname: string; lastname: string; role: string };
  visits: number;
  samples: number;
}

interface Activity {
  id: string;
  date: string;
  gps_anomaly?: boolean;
  nca_reason?: string | null;
  user: { id: string; firstname: string; lastname: string };
  doctor: { doctor_name: string; town: string };
  focused_product: { product_name: string } | null;
}

// ─── Static reference data (no dedicated API yet) ──────────────────────────

const MANAGERS = [
  { name: "Ssenabulya Robert", region: "Central", pct: 87, trend: "up" },
  { name: "Kayiira Moses", region: "Eastern", pct: 91, trend: "up" },
  { name: "Nalwanga Agnes", region: "Northern", pct: 72, trend: "neutral" },
  { name: "Tumusiime Patricia", region: "Western", pct: 65, trend: "down" },
];

const REGIONS = [
  { name: "Central", visits: 245, pct: 85 },
  { name: "Eastern", visits: 189, pct: 74 },
  { name: "South-Western", visits: 181, pct: 71 },
  { name: "Northern", visits: 134, pct: 62 },
  { name: "Western", visits: 98, pct: 45 },
];

const CAMPAIGNS = [
  {
    name: "Cardicare Q1 Push",
    product: "Cardicare 10mg",
    tier: "A",
    status: "Active",
    repsDelivering: 18,
    totalReps: 24,
  },
  {
    name: "DiabePlus Awareness",
    product: "DiabePlus 500mg",
    tier: "B",
    status: "Active",
    repsDelivering: 14,
    totalReps: 24,
  },
  {
    name: "Respira Campaign",
    product: "Respira Inhaler",
    tier: "C",
    status: "Ending Soon",
    repsDelivering: 9,
    totalReps: 24,
  },
];

const COMPETITOR_INTEL = [
  {
    company: "AstraZeneca",
    product: "Brilinta 90mg",
    observation: "Heavy sampling push in Kampala Central — 14 rep sightings this month",
    threat: "high",
  },
  {
    company: "Novo Nordisk",
    product: "Ozempic 1mg",
    observation: "Launching diabetes awareness campaign at Mulago and Case Hospital",
    threat: "medium",
  },
  {
    company: "Pfizer Uganda",
    product: "Lipitor 40mg",
    observation: "Reduced activity vs last quarter — losing ground in Northern region",
    threat: "low",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const barColor = (pct: number) => {
  if (pct >= 75) return "bg-[#16a34a]";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
};

const threatColor = (t: string) => {
  if (t === "high") return { dot: "bg-red-500", badge: "bg-red-50 text-red-600 border-red-200" };
  if (t === "medium") return { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-600 border-amber-200" };
  return { dot: "bg-gray-300", badge: "bg-gray-50 text-gray-500 border-gray-200" };
};

const avatarInitials = (name: string) => {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

// ─── Component ─────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [summary, setSummary] = useState<RepSummary[]>([]);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyFeedApi({ days: 30 }),
      getPendingReportsApi(),
    ]).then(([feedResult, reportsResult]) => {
      if (feedResult.status === "fulfilled") {
        setSummary(feedResult.value.data.summary ?? []);
        setFeed(feedResult.value.data?.data ?? []);
      }
      if (reportsResult.status === "fulfilled") {
        setPendingCount((reportsResult.value.data.data ?? []).length);
      }
      if (feedResult.status === "rejected" && reportsResult.status === "rejected") {
        setError("Failed to load dashboard data.");
      }
    }).finally(() => setLoading(false));
  }, []);

  const totalReps = summary.length;
  const totalVisits = summary.reduce((s, r) => s + r.visits, 0);

  // ─── Derive product performance from real data ──────────────────────────
  const productMap: Record<string, number> = {};
  feed.forEach((a) => {
    const name = a.focused_product?.product_name;
    if (name) productMap[name] = (productMap[name] ?? 0) + 1;
  });
  const totalFeedActivities = feed.length;
  const derivedProducts = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      name,
      count,
      pct: totalFeedActivities > 0 ? Math.round((count / totalFeedActivities) * 100) : 0,
      color: ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444"][i],
    }));

  // ─── GPS Anomalies ──────────────────────────────────────────────────────
  const gpsAnomalies = feed.filter((a) => a.gps_anomaly === true);

  const kpiCards = [
    {
      label: "Total Reps",
      value: loading ? "—" : totalReps,
      sub: "Active this month",
      gradient: "from-[#16a34a] to-[#15803d]",
      icon: FaUserGroup,
      shadow: "shadow-green-200",
    },
    {
      label: "Visits This Month",
      value: loading ? "—" : totalVisits.toLocaleString(),
      sub: "GPS-verified calls",
      gradient: "from-sky-500 to-sky-600",
      icon: IoCalendarOutline,
      shadow: "shadow-sky-100",
    },
    {
      label: "Active Campaigns",
      value: CAMPAIGNS.filter((c) => c.status === "Active").length,
      sub: "Running nationwide",
      gradient: "from-amber-500 to-amber-600",
      icon: IoMegaphoneOutline,
      shadow: "shadow-amber-100",
    },
    {
      label: "Pending Approvals",
      value: loading ? "—" : pendingCount,
      sub: "Reports awaiting review",
      gradient: pendingCount > 0 ? "from-orange-500 to-red-500" : "from-gray-400 to-gray-500",
      icon: LuReceiptText,
      shadow: pendingCount > 0 ? "shadow-orange-100" : "shadow-gray-100",
    },
  ];

  return (
    <div className="w-full p-6 flex flex-col gap-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">National Overview</h1>
        <p className="text-gray-400 text-sm mt-0.5">Country-wide field performance — last 30 days</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <MdOutlineWarningAmber className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.shadow} cursor-pointer hover:-translate-y-0.5`}
              style={{ transition: "transform 0.2s ease" }}
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-black text-white text-3xl leading-none">{card.value}</p>
                <p className="text-white/90 font-bold text-[13px] mt-2 leading-tight">{card.label}</p>
                <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Manager Performance + Product Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Manager Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-100 border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">Manager Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Visit completion vs monthly target</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {MANAGERS.map((mgr) => (
              <div key={mgr.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#16a34a] font-black text-xs">{avatarInitials(mgr.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{mgr.name}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {mgr.trend === "up" && <FaArrowTrendUp className="w-3 h-3 text-[#16a34a]" />}
                      {mgr.trend === "down" && <FaArrowTrendDown className="w-3 h-3 text-red-500" />}
                      <span className={`text-xs font-bold ${mgr.pct >= 75 ? "text-[#16a34a]" : mgr.pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {mgr.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${barColor(mgr.pct)}`}
                      style={{ width: `${mgr.pct}%`, transition: "width 0.6s ease" }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{mgr.region} Region</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-100 border border-gray-50">
          <div className="mb-5">
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Product Performance</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {!loading && derivedProducts.length > 0
                ? "Detailing share from live feed data"
                : "Detailing coverage this month"}
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#16a34a] animate-spin" />
            </div>
          ) : derivedProducts.length > 0 ? (
            <div className="flex flex-col gap-5">
              {derivedProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <p className="text-sm font-medium text-[#1a1a1a]">{p.name}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: p.color }}>{p.pct}%</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${p.pct}%`, backgroundColor: p.color, transition: "width 0.6s ease" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-gray-400 text-sm font-medium">No product data yet</p>
              <p className="text-gray-300 text-xs mt-1">Product detailing data will appear here as reps log visits</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Regional Coverage ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-100 border border-gray-50">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Coverage by Region</h2>
            <p className="text-xs text-gray-400 mt-0.5">Territory heatmap — Phase 1 (Leaflet map coming)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REGIONS.map((r) => (
            <div
              key={r.name}
              className="flex flex-col items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:-translate-y-0.5"
              style={{ transition: "transform 0.2s ease" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                style={{
                  background: r.pct >= 75
                    ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                    : r.pct >= 50
                    ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                    : "linear-gradient(135deg, #fee2e2, #fecaca)",
                }}
              >
                <span
                  className="font-black text-lg"
                  style={{ color: r.pct >= 75 ? "#16a34a" : r.pct >= 50 ? "#d97706" : "#dc2626" }}
                >
                  {r.pct}%
                </span>
              </div>
              <p className="font-bold text-[#1a1a1a] text-sm text-center">{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.visits} visits</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── GPS Anomalies — National ── */}
      {!loading && gpsAnomalies.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <MdOutlineGpsOff className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="font-bold text-[#1a1a1a] text-[15px]">GPS Anomalies — National</h2>
              <p className="text-xs text-gray-400">Visits flagged for GPS mismatch across all regions</p>
            </div>
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
              {gpsAnomalies.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {gpsAnomalies.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1a1a1a]">
                      {a.user.firstname} {a.user.lastname}
                    </span>
                    <span className="text-gray-300 text-xs">→</span>
                    <span className="text-sm text-gray-600">{a.doctor.doctor_name}</span>
                    <span className="text-xs text-gray-400">{a.doctor.town}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(a.date), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                  Anomaly
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Campaigns ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-100 border border-gray-50">
        <div className="mb-5">
          <h2 className="font-bold text-[#1a1a1a] text-[15px]">Active Campaigns</h2>
          <p className="text-xs text-gray-400 mt-0.5">Rep delivery coverage per campaign</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CAMPAIGNS.map((c) => {
            const coveragePct = Math.round((c.repsDelivering / c.totalReps) * 100);
            return (
              <div
                key={c.name}
                className="border border-gray-100 rounded-xl p-4 hover:-translate-y-0.5 cursor-pointer"
                style={{ transition: "transform 0.2s ease" }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-bold text-[#1a1a1a] text-sm leading-snug">{c.name}</p>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      c.status === "Active"
                        ? "bg-green-50 text-[#16a34a] border-green-200"
                        : "bg-orange-50 text-orange-600 border-orange-200"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{c.product} · Tier {c.tier}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-[#16a34a]"
                    style={{ width: `${coveragePct}%`, transition: "width 0.6s ease" }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-[#1a1a1a]">{c.repsDelivering}/{c.totalReps}</span> reps delivering
                  <span className="ml-1 text-[#16a34a] font-semibold">({coveragePct}%)</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Competitor Intelligence ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-100 border border-gray-50">
        <div className="flex items-center gap-2 mb-5">
          <LuShield className="w-5 h-5 text-[#16a34a]" />
          <div>
            <h2 className="font-bold text-[#1a1a1a] text-[15px]">Competitor Intelligence</h2>
            <p className="text-xs text-gray-400">Field observations logged by reps this month</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {COMPETITOR_INTEL.map((item) => {
            const colors = threatColor(item.threat);
            return (
              <div
                key={item.company}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${colors.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-[#1a1a1a] text-sm">{item.company}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-sm text-gray-500">{item.product}</p>
                    <span
                      className={`ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${colors.badge}`}
                    >
                      {item.threat} threat
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.observation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
