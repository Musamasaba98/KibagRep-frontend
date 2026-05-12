import { useEffect, useState, useMemo } from "react";
import { format, subDays, isWeekend } from "date-fns";
import { LuCircleCheck, LuCircleX, LuTriangleAlert, LuMinus } from "react-icons/lu";
import { BiSearch } from "react-icons/bi";
import { getCompanyUsersApi, getCompanyReportsApi, getCompanyTeamsApi } from "../../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface DayStatus { date: string; label: string; submitted: boolean; isWeekend: boolean; }

interface RepRow {
  id: string;
  name: string;
  teamName: string;
  teamId: string;
  days: DayStatus[];
  submittedCount: number;
  weekdayCount: number;
}

interface Team { id: string; team_name: string; }

// ── Helper: last 7 calendar days (yesterday back) ─────────────────────────

const getLast7 = (): { date: string; label: string; isWeekend: boolean }[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d   = subDays(new Date(), i + 1);
    return {
      date:      format(d, "yyyy-MM-dd"),
      label:     format(d, "EEE"),   // Mon, Tue …
      isWeekend: isWeekend(d),
    };
  }).reverse();  // oldest → newest

// ── Day pill ──────────────────────────────────────────────────────────────

const DayPill = ({ day }: { day: DayStatus }) => {
  if (day.isWeekend) {
    return (
      <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
        <span className="text-[9px] font-bold text-gray-300 uppercase">{day.label}</span>
        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
          <LuMinus className="w-3 h-3 text-gray-300" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
      <span className="text-[9px] font-bold text-gray-400 uppercase">{day.label}</span>
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
        day.submitted
          ? "bg-[#f0fdf4] border-[#bbf7d0]"
          : "bg-red-50 border-red-200"
      }`}>
        {day.submitted
          ? <LuCircleCheck className="w-3.5 h-3.5 text-[#16a34a]" />
          : <LuCircleX    className="w-3.5 h-3.5 text-red-500"    />
        }
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const Compliance = () => {
  const [rows, setRows]       = useState<RepRow[]>([]);
  const [teams, setTeams]     = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  useEffect(() => {
    const last7 = getLast7();

    Promise.allSettled([
      getCompanyUsersApi(),
      getCompanyReportsApi("days=7"),
      getCompanyTeamsApi(),
    ]).then(([uRes, rRes, tRes]) => {
      const users: any[]   = uRes.status === "fulfilled" ? (uRes.value.data?.data ?? uRes.value.data ?? []) : [];
      const reports: any[] = rRes.status === "fulfilled" ? (rRes.value.data?.data ?? []) : [];
      const teamsData: Team[] = tRes.status === "fulfilled" ? (tRes.value.data?.data ?? []) : [];

      setTeams(teamsData);

      // Build submitted set: "userId__yyyy-MM-dd"
      const submittedSet = new Set<string>();
      reports.forEach((r: any) => {
        if (r.user?.id && r.report_date) {
          try { submittedSet.add(`${r.user.id}__${format(new Date(r.report_date), "yyyy-MM-dd")}`); }
          catch { /* skip */ }
        }
      });

      const reps = users.filter((u) => u.role === "MedicalRep");
      const weekdayCount = last7.filter((d) => !d.isWeekend).length;

      const repRows: RepRow[] = reps.map((u) => {
        const days: DayStatus[] = last7.map((d) => ({
          date:      d.date,
          label:     d.label,
          isWeekend: d.isWeekend,
          submitted: d.isWeekend ? false : submittedSet.has(`${u.id}__${d.date}`),
        }));
        const submittedCount = days.filter((d) => !d.isWeekend && d.submitted).length;
        return {
          id:           u.id,
          name:         `${u.firstname} ${u.lastname}`,
          teamName:     u.team?.team_name ?? "Unassigned",
          teamId:       u.team?.id ?? "",
          days,
          submittedCount,
          weekdayCount,
        };
      }).sort((a, b) => a.submittedCount - b.submittedCount); // worst first

      setRows(repRows);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalReps    = rows.length;
  const fullCompliant = rows.filter((r) => r.submittedCount === r.weekdayCount).length;
  const nonCompliant  = rows.filter((r) => r.submittedCount < Math.ceil(r.weekdayCount * 0.6)).length;
  const avgPct = totalReps > 0
    ? Math.round(rows.reduce((s, r) => s + (r.submittedCount / Math.max(r.weekdayCount, 1)) * 100, 0) / totalReps)
    : 0;

  // ── Filtered rows ──────────────────────────────────────────────────────

  const filtered = useMemo(() => rows.filter((r) => {
    const matchName = r.name.toLowerCase().includes(search.toLowerCase());
    const matchTeam = teamFilter === "" || r.teamId === teamFilter;
    return matchName && matchTeam;
  }), [rows, search, teamFilter]);

  // ── Status badge config ────────────────────────────────────────────────

  const statusFor = (r: RepRow) => {
    const pct = r.weekdayCount > 0 ? (r.submittedCount / r.weekdayCount) * 100 : 100;
    if (pct >= 80) return { label: "Compliant",     bg: "bg-green-100", text: "text-[#16a34a]", Icon: LuCircleCheck };
    if (pct >= 50) return { label: "At Risk",        bg: "bg-amber-100", text: "text-amber-700", Icon: LuTriangleAlert };
    return           { label: "Non-Compliant",    bg: "bg-red-100",   text: "text-red-600",   Icon: LuCircleX    };
  };

  const last7Labels = getLast7();

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-black text-2xl text-[#1a1a1a] tracking-tight">Field Compliance</h1>
        <p className="text-gray-400 text-sm mt-0.5">Daily report submissions — last 7 calendar days</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Reps",        value: totalReps,     color: "text-gray-700",  bg: "bg-white",        border: "border-gray-100" },
          { label: "Fully Compliant",   value: fullCompliant, color: "text-[#16a34a]", bg: "bg-[#f0fdf4]",   border: "border-[#dcfce7]" },
          { label: "Non-Compliant",     value: nonCompliant,  color: nonCompliant > 0 ? "text-red-600" : "text-gray-400", bg: nonCompliant > 0 ? "bg-red-50" : "bg-white", border: nonCompliant > 0 ? "border-red-200" : "border-gray-100" },
          { label: "Avg Compliance",    value: `${avgPct}%`,  color: avgPct >= 70 ? "text-[#16a34a]" : avgPct >= 50 ? "text-amber-600" : "text-red-600", bg: "bg-white", border: "border-gray-100" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 shadow-[0_2px_6px_0_rgba(0,0,0,0.04)]`}>
            <p className="text-xs font-semibold text-gray-400">{s.label}</p>
            {loading ? (
              <div className="h-7 w-10 bg-gray-100 rounded animate-pulse mt-1" />
            ) : (
              <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xs px-3 h-9 rounded-xl bg-white border border-gray-200 focus-within:border-[#16a34a] focus-within:ring-1 focus-within:ring-[#16a34a]/20"
          style={{ transition: "border-color 0.15s" }}>
          <BiSearch className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search rep name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 flex-1"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/20"
          style={{ transition: "border-color 0.15s" }}
        >
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">

        {/* Column headers */}
        <div className="px-5 py-3 border-b border-gray-100 hidden sm:flex items-center gap-4">
          <p className="w-48 shrink-0 text-xs font-bold text-gray-400 uppercase tracking-wider">Rep</p>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex gap-2">
              {last7Labels.map((d) => (
                <div key={d.date} className="w-7 text-center">
                  <span className="text-[9px] font-bold text-gray-300 uppercase">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="w-20 text-xs font-bold text-gray-400 uppercase tracking-wider text-center shrink-0">Rate</p>
          <p className="w-24 text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Status</p>
        </div>

        {loading ? (
          <div className="flex flex-col divide-y divide-gray-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 h-4 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-32 h-4 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <LuCircleCheck className="w-10 h-10 text-[#16a34a] mb-3" />
            <p className="font-semibold text-gray-600">
              {rows.length === 0 ? "No medical reps found." : "No reps match your filters."}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {rows.length > 0 && "Try clearing the search or team filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((rep) => {
              const pct     = rep.weekdayCount > 0 ? Math.round((rep.submittedCount / rep.weekdayCount) * 100) : 100;
              const barColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
              const status  = statusFor(rep);
              const StatusIcon = status.Icon;

              return (
                <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/50">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 w-48 shrink-0 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center shrink-0">
                      <span className="text-[#16a34a] font-black text-[10px]">
                        {rep.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a] truncate">{rep.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{rep.teamName}</p>
                    </div>
                  </div>

                  {/* Day pills */}
                  <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                    {rep.days.map((d) => (
                      <DayPill key={d.date} day={d} />
                    ))}
                  </div>

                  {/* Rate bar */}
                  <div className="flex items-center gap-2 w-20 shrink-0">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.4s ease" }} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-8 text-right shrink-0">{pct}%</span>
                  </div>

                  {/* Status badge */}
                  <div className="w-24 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Compliance;
