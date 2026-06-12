import { useState, useEffect, useCallback } from "react";
import {
  FaPills, FaPlus, FaXmark, FaCalendarCheck,
  FaChevronLeft, FaChevronRight, FaChartBar,
} from "react-icons/fa6";
import { MdOutlineMedication } from "react-icons/md";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import {
  getCompanyUsersApi, getProductsForRepApi,
  issueSamplesBatchApi, getTeamSampleSummaryApi,
} from "../../../services/api";
import api from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product    { id: string; product_name: string; }
interface User       { id: string; firstname: string; lastname: string; role: string; }
interface Balance    {
  id: string; issued: number; given: number; month: number; year: number;
  product: { product_name: string };
  user: { firstname: string; lastname: string };
}
interface RepSummary {
  user_id: string; name: string;
  total_issued: number; total_given: number; usage_pct: number;
  products: { product_name: string; issued: number; given: number }[];
}
interface Allocation { product_id: string; quantity: string; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ml = (m: number, y: number) => `${MONTHS[m - 1]} ${y}`;

// ─── Summary row ──────────────────────────────────────────────────────────────

const SummaryRow = ({ rep }: { rep: RepSummary }) => {
  const [open, setOpen] = useState(false);
  const remaining = rep.total_issued - rep.total_given;
  const barColor =
    rep.usage_pct >= 90 ? "#dc2626" :
    rep.usage_pct >= 70 ? "#d97706" : "#16a34a";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 focus-visible:outline-none"
        style={{ transition: "background-color 0.12s" }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-[#16a34a]">
            {rep.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1a2530] truncate">{rep.name}</p>
          {/* Usage bar */}
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
            <div className="h-full rounded-full" style={{ width: `${rep.usage_pct}%`, backgroundColor: barColor, transition: "width 0.4s" }} />
          </div>
        </div>

        <div className="text-right shrink-0 mr-2">
          <p className="text-base font-black" style={{ color: barColor }}>{rep.usage_pct}%</p>
          <p className="text-[10px] text-gray-400">{rep.total_given}/{rep.total_issued} given</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[#1a2530]">{remaining}</p>
          <p className="text-[10px] text-gray-400">remaining</p>
        </div>

        {open
          ? <BiChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <BiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-50 divide-y divide-gray-50">
          {rep.products.map(p => {
            const pct = p.issued > 0 ? Math.round((p.given / p.issued) * 100) : 0;
            return (
              <div key={p.product_name} className="flex items-center gap-3 px-5 py-2.5 bg-gray-50/30">
                <MdOutlineMedication className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                <span className="flex-1 text-xs font-medium text-gray-700 truncate">{p.product_name}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{p.given}/{p.issued}</span>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 w-7 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Samples = () => {
  const now = new Date();
  const [tab, setTab] = useState<"monthly" | "summary">("monthly");

  // ── Monthly view state ──
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [balances,  setBalances]  = useState<Balance[]>([]);
  const [balLoading, setBalLoading] = useState(true);

  // ── Summary view state ──
  const [fromMonth, setFromMonth] = useState(now.getMonth() === 0 ? 1 : 1);
  const [fromYear,  setFromYear]  = useState(now.getFullYear());
  const [toMonth,   setToMonth]   = useState(now.getMonth() + 1);
  const [toYear,    setToYear]    = useState(now.getFullYear());
  const [summary,   setSummary]   = useState<RepSummary[]>([]);
  const [sumLoading, setSumLoading] = useState(false);

  // ── Shared ──
  const [reps,       setReps]      = useState<User[]>([]);
  const [showModal,  setShowModal] = useState(false);
  const [repId,      setRepId]     = useState("");
  const [newMonth,   setNewMonth]  = useState(true);
  const [issueMonth, setIssueMonth] = useState(now.getMonth() + 1);
  const [issueYear,  setIssueYear]  = useState(now.getFullYear());
  const [modalProducts, setModalProducts] = useState<Product[]>([]);
  const [prodLoading,   setProdLoading]   = useState(false);
  const [allocations,   setAllocations]   = useState<Allocation[]>([]);
  const [saving,     setSaving]    = useState(false);
  const [formError,  setFormError] = useState("");

  // ── Loaders ──
  const loadBalances = useCallback((m: number, y: number) => {
    setBalLoading(true);
    api.get("/sample-balance/team", { params: { month: m, year: y } })
      .then(r => setBalances(r.data.data ?? []))
      .catch(() => setBalances([]))
      .finally(() => setBalLoading(false));
  }, []);

  const loadSummary = useCallback((fm: number, fy: number, tm: number, ty: number) => {
    setSumLoading(true);
    getTeamSampleSummaryApi({ from_month: fm, from_year: fy, to_month: tm, to_year: ty })
      .then(r => setSummary(r.data.data ?? []))
      .catch(() => setSummary([]))
      .finally(() => setSumLoading(false));
  }, []);

  useEffect(() => {
    getCompanyUsersApi()
      .then(r => setReps((r.data.data ?? []).filter((u: User) => ["MedicalRep","Supervisor"].includes(u.role))))
      .catch(() => {});
    loadBalances(viewMonth, viewYear);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Month navigator
  const navigate = (delta: number) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 1)  { m = 12; y -= 1; }
    if (m > 12) { m = 1;  y += 1; }
    setViewMonth(m); setViewYear(y);
    loadBalances(m, y);
  };

  // Modal: load products when rep changes
  useEffect(() => {
    if (!repId) { setModalProducts([]); setAllocations([]); return; }
    setProdLoading(true);
    getProductsForRepApi(repId)
      .then(r => {
        const prods: Product[] = r.data.data ?? [];
        setModalProducts(prods);
        setAllocations(prods.map(p => ({ product_id: p.id, quantity: "" })));
      })
      .catch(() => { setModalProducts([]); setAllocations([]); })
      .finally(() => setProdLoading(false));
  }, [repId]);

  const setQty = (idx: number, qty: string) =>
    setAllocations(a => a.map((row, i) => i === idx ? { ...row, quantity: qty } : row));

  const handleIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormError("");
    const valid = allocations.filter(a => parseInt(a.quantity) > 0);
    if (!repId) { setFormError("Select a rep"); return; }
    if (!valid.length) { setFormError("Enter a quantity for at least one product"); return; }
    setSaving(true);
    try {
      await issueSamplesBatchApi({
        user_id: repId,
        allocations: valid.map(a => ({ product_id: a.product_id, quantity: parseInt(a.quantity) })),
        new_month: newMonth, month: issueMonth, year: issueYear,
      });
      setShowModal(false);
      setRepId(""); setAllocations([]); setNewMonth(true);
      loadBalances(viewMonth, viewYear);
      if (tab === "summary") loadSummary(fromMonth, fromYear, toMonth, toYear);
    } catch (err: any) { setFormError(err.response?.data?.message || "Failed to issue samples"); }
    finally { setSaving(false); }
  };

  const openModal = () => {
    setRepId(""); setAllocations([]); setNewMonth(true);
    setIssueMonth(now.getMonth() + 1); setIssueYear(now.getFullYear());
    setFormError(""); setShowModal(true);
  };

  // Group monthly balances by rep
  const byRep: Record<string, { name: string; items: Balance[] }> = {};
  for (const b of balances) {
    const name = `${b.user.firstname} ${b.user.lastname}`;
    if (!byRep[name]) byRep[name] = { name, items: [] };
    byRep[name].items.push(b);
  }

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Sample Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monthly allocation and usage tracking</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Issue Samples</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: "monthly", label: "Monthly",  Icon: FaChevronLeft },
          { id: "summary", label: "Period Summary", Icon: FaChartBar },
        ] as const).map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold focus-visible:outline-none ${tab === id ? "bg-white text-[#1a2530] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ transition: "background-color 0.12s, color 0.12s" }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── MONTHLY VIEW ─────────────────────────────────────────────────── */}
      {tab === "monthly" && (
        <>
          {/* Month navigator */}
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] w-fit">
            <button onClick={() => navigate(-1)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none"
              style={{ transition: "background-color 0.12s" }}>
              <FaChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-sm font-black text-[#1a2530] min-w-[80px] text-center">
              {ml(viewMonth, viewYear)}
              {isCurrentMonth && <span className="ml-1.5 text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">Current</span>}
            </span>
            <button onClick={() => navigate(1)} disabled={isCurrentMonth}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 focus-visible:outline-none"
              style={{ transition: "background-color 0.12s" }}>
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>

          {balLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          ) : Object.keys(byRep).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-gray-400">
              <FaPills className="w-10 h-10 mb-3 opacity-20" />
              <p className="font-semibold">No allocations for {ml(viewMonth, viewYear)}</p>
              <p className="text-sm mt-1">{isCurrentMonth ? "Issue samples to reps to start tracking" : "No samples were issued this month"}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.values(byRep).map(rep => {
                const totalIssued = rep.items.reduce((s, b) => s + b.issued, 0);
                const totalGiven  = rep.items.reduce((s, b) => s + b.given, 0);
                const pctUsed     = totalIssued > 0 ? Math.round((totalGiven / totalIssued) * 100) : 0;
                return (
                  <div key={rep.name} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/40 flex items-center gap-3">
                      <p className="text-sm font-bold text-[#1a2530] flex-1">{rep.name}</p>
                      <span className="text-[11px] font-semibold text-gray-500">{totalGiven}/{totalIssued} used</span>
                      <span className={`text-[11px] font-black ${pctUsed >= 90 ? "text-amber-600" : "text-[#16a34a]"}`}>{pctUsed}%</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {rep.items.map(b => {
                        const remaining = b.issued - b.given;
                        const pct = b.issued > 0 ? Math.round((b.given / b.issued) * 100) : 0;
                        return (
                          <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                            <MdOutlineMedication className="w-4 h-4 text-[#16a34a] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#1a2530] truncate">{b.product.product_name}</p>
                              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[160px]">
                                <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct}%`, transition: "width 0.3s" }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-[#1a2530]">{remaining} left</p>
                              <p className="text-[10px] text-gray-400">{b.given} of {b.issued} given</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── PERIOD SUMMARY VIEW ───────────────────────────────────────────── */}
      {tab === "summary" && (
        <>
          {/* Date range controls */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] px-5 py-4 flex flex-wrap items-end gap-4">
            <div className="flex gap-2 items-end">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">From</p>
                <div className="flex gap-2">
                  <select value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))}
                    className="px-2.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" min={2024} max={2030} value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))}
                    className="w-20 px-2.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              </div>
              <span className="text-gray-400 text-sm pb-2">→</span>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">To</p>
                <div className="flex gap-2">
                  <select value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))}
                    className="px-2.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" min={2024} max={2030} value={toYear} onChange={e => setToYear(parseInt(e.target.value))}
                    className="w-20 px-2.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              </div>
            </div>
            <button
              onClick={() => loadSummary(fromMonth, fromYear, toMonth, toYear)}
              className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}>
              Apply
            </button>
          </div>

          {/* Legend */}
          {summary.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-400 px-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" /> &lt;70% used</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 70–90%</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> &gt;90%</span>
              <span className="ml-auto font-semibold text-gray-500">{ml(fromMonth, fromYear)} – {ml(toMonth, toYear)} · {summary.length} reps</span>
            </div>
          )}

          {sumLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
            </div>
          ) : summary.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-gray-400">
              <FaChartBar className="w-10 h-10 mb-3 opacity-20" />
              <p className="font-semibold">No data for this period</p>
              <p className="text-sm mt-1">Select a range and press Apply</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {summary.map(rep => <SummaryRow key={rep.user_id} rep={rep} />)}
            </div>
          )}
        </>
      )}

      {/* ── ISSUE SAMPLES MODAL ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Issue Samples</h2>
                <p className="text-xs text-gray-400 mt-0.5">{ml(issueMonth, issueYear)} allocation</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssue} className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{formError}</div>}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rep</label>
                <select required value={repId} onChange={e => setRepId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                  <option value="">Select rep…</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.firstname} {r.lastname}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Month</label>
                  <select value={issueMonth} onChange={e => setIssueMonth(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Year</label>
                  <input type="number" min={2024} max={2030} value={issueYear}
                    onChange={e => setIssueYear(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
                </div>
              </div>

              <button type="button" onClick={() => setNewMonth(v => !v)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold focus-visible:outline-none ${newMonth ? "border-[#16a34a] bg-[#f0fdf4] text-[#15803d]" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                style={{ transition: "border-color 0.15s, background-color 0.15s" }}>
                <FaCalendarCheck className="w-4 h-4 shrink-0" />
                <div className="flex-1">
                  <span>New Month Allocation</span>
                  <p className="text-xs font-normal mt-0.5 opacity-70">
                    {newMonth ? "Resets given to 0 and sets fresh quantities for this month" : "Adds to existing balance — mid-month top-up"}
                  </p>
                </div>
                <div className={`w-9 h-5 rounded-full shrink-0 relative ${newMonth ? "bg-[#16a34a]" : "bg-gray-300"}`} style={{ transition: "background-color 0.15s" }}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newMonth ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>

              {!repId ? (
                <p className="text-xs text-gray-400 text-center py-4">Select a rep to see their products</p>
              ) : prodLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
                </div>
              ) : allocations.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No products found for this rep</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-500">Quantities</label>
                  {allocations.map((row, idx) => (
                    <div key={row.product_id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <MdOutlineMedication className="w-4 h-4 text-[#16a34a] shrink-0" />
                      <span className="flex-1 text-sm text-[#1a2530] font-medium truncate">{modalProducts[idx]?.product_name}</span>
                      <input type="number" min={0} placeholder="0" value={row.quantity}
                        onChange={e => setQty(idx, e.target.value)}
                        className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1 shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none"
                  style={{ transition: "background-color 0.15s" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !repId || allocations.every(a => !parseInt(a.quantity))}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Issuing…" : newMonth ? `Issue for ${ml(issueMonth, issueYear)}` : "Top Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Samples;
