import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BiBell } from "react-icons/bi";
import { LuChevronRight, LuCheckCheck } from "react-icons/lu";
import { format } from "date-fns";
import {
  getPendingReportsApi, approveReportApi,
  getPendingExpenseClaimsApi, approveExpenseClaimApi,
  getPendingCyclesApi, approveCycleApi,
} from "../../services/api";

// ─── Role config ──────────────────────────────────────────────────────────────

interface RoleCfg {
  fetchReports: boolean;
  fetchExpenses: boolean;
  fetchCycles: boolean;
  canApproveReports: boolean;
  canApproveExpenses: boolean;
  canApproveCycles: boolean;
  reportsPath: string;
  expensesPath: string;
  cyclesPath: string;
}

const ROLE_CFG: Record<string, RoleCfg> = {
  Supervisor: {
    fetchReports: true, fetchExpenses: true, fetchCycles: true,
    canApproveReports: true, canApproveExpenses: true, canApproveCycles: true,
    reportsPath: "/supervisor/approvals",
    expensesPath: "/supervisor/approvals",
    cyclesPath: "/supervisor/cycles",
  },
  Manager: {
    fetchReports: true, fetchExpenses: true, fetchCycles: true,
    canApproveReports: true, canApproveExpenses: true, canApproveCycles: true,
    reportsPath: "/manager/approvals",
    expensesPath: "/manager/approvals",
    cyclesPath: "/manager/cycles",
  },
  SALES_ADMIN: {
    fetchReports: false, fetchExpenses: true, fetchCycles: false,
    canApproveReports: false, canApproveExpenses: true, canApproveCycles: false,
    reportsPath: "/admin",
    expensesPath: "/admin/expenses",
    cyclesPath: "/admin",
  },
  SUPER_ADMIN: {
    fetchReports: false, fetchExpenses: true, fetchCycles: false,
    canApproveReports: false, canApproveExpenses: true, canApproveCycles: false,
    reportsPath: "/admin",
    expensesPath: "/admin/expenses",
    cyclesPath: "/admin",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Person { firstname?: string; lastname?: string; }
interface PendingReport { id: string; user?: Person; report_date?: string; visits_count?: number; }
interface PendingExpense { id: string; user?: Person; month?: string; year?: number; total_amount?: number; }
interface PendingCycle { id: string; user?: Person; month?: string; year?: number; doctor_count?: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (p?: Person) => p ? `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim() || "—" : "—";

const extractList = (res: any): any[] => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  for (const key of ["reports", "claims", "cycles", "data", "items"]) {
    if (Array.isArray(d?.[key])) return d[key];
  }
  return [];
};

// ─── Sub-section ──────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  items: Array<{ id: string; label: string; sub: string }>;
  canApprove: boolean;
  allPath: string;
  onApprove: (id: string) => Promise<void>;
  onNavigate: (path: string) => void;
  hasBorderTop: boolean;
}

const Section = ({ title, items, canApprove, allPath, onApprove, onNavigate, hasBorderTop }: SectionProps) => {
  const [approving, setApproving] = useState<string | null>(null);

  const doApprove = async (id: string) => {
    setApproving(id);
    try { await onApprove(id); } finally { setApproving(null); }
  };

  return (
    <section className={hasBorderTop ? "border-t border-gray-50" : ""}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[10px] font-poppins-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <button
          onClick={() => onNavigate(allPath)}
          className="text-[10px] font-poppins-semibold text-[#16a34a] flex items-center gap-0.5 hover:underline"
        >
          View all <LuChevronRight className="w-3 h-3" />
        </button>
      </div>

      {items.slice(0, 3).map(item => (
        <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50" style={{ transition: "background-color 0.1s" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-poppins-semibold text-[#1a1a1a] truncate">{item.label}</p>
            <p className="text-[11px] text-gray-400 font-poppins leading-tight truncate">{item.sub}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canApprove && (
              <button
                onClick={() => doApprove(item.id)}
                disabled={approving === item.id}
                className="px-2.5 py-1 rounded-lg text-[11px] font-poppins-semibold bg-[#dcfce7] text-[#16a34a] hover:bg-[#16a34a] hover:text-white disabled:opacity-50"
                style={{ transition: "background-color 0.15s, color 0.15s" }}
              >
                {approving === item.id ? "…" : "Approve"}
              </button>
            )}
            <button
              onClick={() => onNavigate(allPath)}
              className="p-1 rounded-lg text-gray-300 hover:text-[#16a34a] hover:bg-gray-100"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {items.length > 3 && (
        <p className="px-4 pb-2 text-[11px] text-gray-400 font-poppins">+{items.length - 3} more</p>
      )}
    </section>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Extra classes on the trigger button (e.g. bg-gray-100 vs bg-gray-50) */
  btnCls?: string;
}

const NotificationBell = ({ btnCls = "bg-gray-100 hover:bg-[#dcfce7] text-gray-500 hover:text-[#16a34a]" }: NotificationBellProps) => {
  const role: string = useSelector((s: any) => s.auth?.user?.role ?? s.auth?.role ?? "");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reports, setReports]   = useState<PendingReport[]>([]);
  const [expenses, setExpenses] = useState<PendingExpense[]>([]);
  const [cycles, setCycles]     = useState<PendingCycle[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const cfg = ROLE_CFG[role] ?? null;
  const total = reports.length + expenses.length + cycles.length;

  // Click-outside dismissal
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const load = async () => {
    if (!cfg || loading) return;
    setLoading(true);
    try {
      const [r, e, c] = await Promise.all([
        cfg.fetchReports  ? getPendingReportsApi().then(extractList)      : Promise.resolve([]),
        cfg.fetchExpenses ? getPendingExpenseClaimsApi().then(extractList) : Promise.resolve([]),
        cfg.fetchCycles   ? getPendingCyclesApi().then(extractList)        : Promise.resolve([]),
      ]);
      setReports(r);
      setExpenses(e);
      setCycles(c);
    } catch {
      // silently fail — no crash on network error
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleNav = (path: string) => { navigate(path); setOpen(false); };

  // Map raw data to display shape
  const reportItems = reports.map(r => ({
    id: r.id,
    label: fmt(r.user),
    sub: `${r.report_date ? format(new Date(r.report_date), "d MMM") : "—"} · ${r.visits_count ?? 0} visit${(r.visits_count ?? 0) === 1 ? "" : "s"}`,
  }));

  const expenseItems = expenses.map(e => ({
    id: e.id,
    label: fmt(e.user),
    sub: [e.month, e.year, e.total_amount != null ? `UGX ${Number(e.total_amount).toLocaleString()}` : ""].filter(Boolean).join(" · "),
  }));

  const cycleItems = cycles.map(c => ({
    id: c.id,
    label: fmt(c.user),
    sub: [c.month, c.year, c.doctor_count != null ? `${c.doctor_count} doctors` : ""].filter(Boolean).join(" · "),
  }));

  // If this role has no config, render a non-interactive bell (no dropdown)
  if (!cfg) {
    return (
      <button
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${btnCls}`}
        style={{ transition: "background-color 0.15s, color 0.15s" }}
        aria-label="Notifications"
      >
        <BiBell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      {/* ── Trigger ── */}
      <button
        onClick={toggle}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] ${btnCls}`}
        style={{ transition: "background-color 0.15s, color 0.15s" }}
        aria-label={`Notifications${total > 0 ? ` · ${total} pending` : ""}`}
        aria-expanded={open}
      >
        <BiBell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none pointer-events-none">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 z-[9999] w-[90vw] sm:w-[380px] bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.13)", maxHeight: "72vh", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <p className="font-poppins-bold text-[#1a1a1a] text-sm">Notifications</p>
            {loading && (
              <div className="w-4 h-4 rounded-full border-2 border-[#16a34a] border-t-transparent animate-spin" />
            )}
          </div>

          {/* Empty */}
          {!loading && total === 0 && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <LuCheckCheck className="w-8 h-8 mb-2 text-[#16a34a] opacity-40" />
              <p className="text-sm font-poppins-semibold text-gray-500">All caught up!</p>
              <p className="text-xs font-poppins mt-0.5">No pending approvals</p>
            </div>
          )}

          {/* Reports */}
          {reportItems.length > 0 && (
            <Section
              title="Daily Reports"
              items={reportItems}
              canApprove={cfg.canApproveReports}
              allPath={cfg.reportsPath}
              onApprove={id => approveReportApi(id).then(() => setReports(prev => prev.filter(r => r.id !== id)))}
              onNavigate={handleNav}
              hasBorderTop={false}
            />
          )}

          {/* Expenses */}
          {expenseItems.length > 0 && (
            <Section
              title="Expense Claims"
              items={expenseItems}
              canApprove={cfg.canApproveExpenses}
              allPath={cfg.expensesPath}
              onApprove={id => approveExpenseClaimApi(id).then(() => setExpenses(prev => prev.filter(e => e.id !== id)))}
              onNavigate={handleNav}
              hasBorderTop={reportItems.length > 0}
            />
          )}

          {/* Cycles */}
          {cycleItems.length > 0 && (
            <Section
              title="Call Cycles"
              items={cycleItems}
              canApprove={cfg.canApproveCycles}
              allPath={cfg.cyclesPath}
              onApprove={id => approveCycleApi(id).then(() => setCycles(prev => prev.filter(c => c.id !== id)))}
              onNavigate={handleNav}
              hasBorderTop={reportItems.length > 0 || expenseItems.length > 0}
            />
          )}

          <div className="h-3" />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
