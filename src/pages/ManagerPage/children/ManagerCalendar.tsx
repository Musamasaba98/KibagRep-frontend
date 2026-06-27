import { useState, useMemo, useEffect } from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, isAfter, startOfDay,
} from "date-fns";
import { MdChevronLeft, MdChevronRight, MdClose, MdCalendarToday } from "react-icons/md";
import { LuClipboardCheck, LuUsers } from "react-icons/lu";
import { getCompanyReportsApi, getJfwReportsApi } from "../../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportEvent {
  id: string;
  repName: string;
  initials: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  visitsCount: number;
}

interface JfwEvent {
  id: string;
  repName: string;
  initials: string;
}

interface DayData {
  reports: ReportEvent[];
  jfw: JfwEvent[];
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Day cell ──────────────────────────────────────────────────────────────────

const DayCell = ({
  day, inMonth, data, selected, onClick,
}: {
  day: Date; inMonth: boolean;
  data: DayData;
  selected: boolean; onClick: () => void;
}) => {
  const today = isToday(day);
  const approvedCount = data.reports.filter((r) => r.status === "APPROVED").length;
  const pendingCount  = data.reports.filter((r) => r.status !== "APPROVED").length;
  const jfwCount      = data.jfw.length;
  const totalCount    = data.reports.length + jfwCount;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col p-1 sm:p-1.5 cursor-pointer border border-transparent hover:border-[#16a34a]/20 hover:bg-green-50/30 min-h-[44px] sm:min-h-[68px] ${
        selected ? "bg-green-50 border-[#16a34a]/30 rounded-lg" : ""
      } ${!inMonth ? "opacity-35" : ""}`}
    >
      <div className="flex justify-end mb-0.5">
        <span className={`w-5 h-5 sm:w-6 sm:h-6 text-[11px] sm:text-xs font-poppins-bold flex items-center justify-center rounded-full leading-none ${
          today ? "bg-[#16a34a] text-white"
          : selected ? "text-[#16a34a] font-extrabold"
          : "text-[#222f36]"
        }`}>
          {format(day, "d")}
        </span>
      </div>

      {/* Mobile: colored dots */}
      <div className="flex gap-0.5 flex-wrap sm:hidden px-0.5">
        {approvedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />}
        {pendingCount  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
        {jfwCount      > 0 && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
      </div>

      {/* Desktop: pills */}
      <div className="hidden sm:flex flex-col gap-0.5 flex-1">
        {data.reports.slice(0, 2).map((r) => (
          <div key={r.id} className={`flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-semibold truncate ${
            r.status === "APPROVED" ? "bg-[#dcfce7] text-[#15803d]" : "bg-amber-50 text-amber-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === "APPROVED" ? "bg-[#16a34a]" : "bg-amber-400"}`} />
            <span className="truncate font-poppins">{r.repName.split(" ")[0]}</span>
          </div>
        ))}
        {data.jfw.slice(0, data.reports.length >= 2 ? 0 : 1).map((j) => (
          <div key={j.id} className="flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[9px] font-semibold truncate bg-violet-50 text-violet-700">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-500" />
            <span className="truncate font-poppins">JFW {j.repName.split(" ")[0]}</span>
          </div>
        ))}
        {totalCount > 2 && (
          <p className="text-[9px] text-gray-400 font-semibold px-1.5">+{totalCount - 2}</p>
        )}
      </div>
    </div>
  );
};

// ─── Day panel ─────────────────────────────────────────────────────────────────

const DayPanel = ({
  day, data, loading, onClose,
}: {
  day: Date | null; data: DayData; loading: boolean; onClose?: () => void;
}) => {
  const isTodays = day ? isToday(day) : false;
  const isFuture = day ? isAfter(startOfDay(day), startOfDay(new Date())) : false;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-[0_2px_20px_0_rgba(0,0,0,0.08)] bg-white w-full lg:w-[270px] lg:shrink-0">
      {/* Header */}
      <div className={`px-4 py-4 flex items-start justify-between ${isTodays ? "bg-[#16a34a]" : "bg-[#1a2530]"}`}>
        <div>
          <p className="text-white/60 text-[10px] font-poppins-bold uppercase tracking-widest mb-0.5">
            {day ? format(day, "EEEE") : "No day selected"}
          </p>
          <p className="text-white text-2xl font-poppins-bold leading-none">{day ? format(day, "d") : "—"}</p>
          <p className="text-white/70 text-xs font-medium mt-0.5">{day ? format(day, "MMMM yyyy") : ""}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {data.reports.length > 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {data.reports.length} report{data.reports.length !== 1 ? "s" : ""}
              </span>
            )}
            {data.jfw.length > 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-violet-400/40 text-white">
                {data.jfw.length} JFW
              </span>
            )}
            {data.reports.length === 0 && data.jfw.length === 0 && (
              <span className="text-[10px] font-poppins-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">Nothing logged</span>
            )}
            {isTodays && (
              <span className="text-[9px] font-poppins-bold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">TODAY</span>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden focus-visible:outline-none">
            <MdClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-h-[360px] lg:max-h-none">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {data.reports.length > 0 && (
              <div className="p-3 space-y-1.5">
                <p className="text-[9px] font-poppins-bold text-gray-400 uppercase tracking-widest px-1 mb-1">Reports</p>
                {data.reports.map((r) => (
                  <div key={r.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[9px] font-poppins-bold ${
                      r.status === "APPROVED" ? "bg-[#dcfce7] text-[#15803d]" : "bg-amber-50 text-amber-700"
                    }`}>
                      {r.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-poppins-bold text-[#222f36] truncate leading-tight">{r.repName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[9px] font-poppins-semibold px-1.5 py-0.5 rounded-md border ${
                          r.status === "APPROVED" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]"
                          : r.status === "REJECTED" ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                        {r.visitsCount > 0 && (
                          <span className="text-[9px] font-poppins text-gray-400">{r.visitsCount} visit{r.visitsCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.jfw.length > 0 && (
              <div className={`p-3 space-y-1.5 ${data.reports.length > 0 ? "border-t border-gray-50" : ""}`}>
                <p className="text-[9px] font-poppins-bold text-gray-400 uppercase tracking-widest px-1 mb-1">JFW Sessions</p>
                {data.jfw.map((j) => (
                  <div key={j.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50">
                    <div className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center shrink-0 text-[9px] font-poppins-bold text-violet-700">
                      {j.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-poppins-bold text-[#222f36] truncate leading-tight">{j.repName}</p>
                      <p className="text-[10px] font-poppins text-gray-400">Joint Field Work</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.reports.length === 0 && data.jfw.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center px-4">
                {isFuture ? (
                  <>
                    <MdCalendarToday className="w-7 h-7 text-gray-200 mb-2" />
                    <p className="text-xs font-poppins text-gray-400 font-medium">Nothing scheduled</p>
                  </>
                ) : (
                  <>
                    <LuClipboardCheck className="w-7 h-7 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400 font-poppins-semibold">No activity on this day</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const ManagerCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState<Date>(new Date());
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [dayMap,       setDayMap]       = useState<Record<string, DayData>>({});
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getCompanyReportsApi("days=90"),
      getJfwReportsApi(),
    ]).then(([reportsRes, jfwRes]) => {
      const map: Record<string, DayData> = {};

      const ensure = (key: string): DayData => {
        if (!map[key]) map[key] = { reports: [], jfw: [] };
        return map[key];
      };

      if (reportsRes.status === "fulfilled") {
        const reports: any[] = reportsRes.value.data?.data ?? [];
        reports.forEach((r) => {
          try {
            const key = r.report_date.slice(0, 10);
            const fn = r.user?.firstname ?? "";
            const ln = r.user?.lastname  ?? "";
            ensure(key).reports.push({
              id: r.id,
              repName: `${fn} ${ln}`.trim() || "Rep",
              initials: `${fn[0] ?? ""}${ln[0] ?? ""}`.toUpperCase() || "R",
              status: r.status === "APPROVED" ? "APPROVED" : r.status === "REJECTED" ? "REJECTED" : "PENDING",
              visitsCount: r.visits_count ?? 0,
            });
          } catch { /* skip */ }
        });
      }

      if (jfwRes.status === "fulfilled") {
        const jfwList: any[] = jfwRes.value.data?.data ?? [];
        jfwList.forEach((j) => {
          try {
            const key = (j.report_date ?? j.date ?? "").slice(0, 10);
            if (!key) return;
            const fn = j.user?.firstname ?? "";
            const ln = j.user?.lastname  ?? "";
            ensure(key).jfw.push({
              id: j.id,
              repName: `${fn} ${ln}`.trim() || "Rep",
              initials: `${fn[0] ?? ""}${ln[0] ?? ""}`.toUpperCase() || "R",
            });
          } catch { /* skip */ }
        });
      }

      setDayMap(map);
    }).finally(() => setLoading(false));
  }, []);

  const calDays = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end:   endOfWeek(endOfMonth(currentMonth)),
  }), [currentMonth]);

  const monthReports = useMemo(
    () => Object.entries(dayMap).reduce((acc, [key, data]) => {
      try {
        if (isSameMonth(new Date(key), currentMonth)) acc += data.reports.length;
      } catch { /* skip */ }
      return acc;
    }, 0),
    [dayMap, currentMonth]
  );

  const monthJfw = useMemo(
    () => Object.entries(dayMap).reduce((acc, [key, data]) => {
      try {
        if (isSameMonth(new Date(key), currentMonth)) acc += data.jfw.length;
      } catch { /* skip */ }
      return acc;
    }, 0),
    [dayMap, currentMonth]
  );

  const selectedKey  = format(selectedDay, "yyyy-MM-dd");
  const selectedData = dayMap[selectedKey] ?? { reports: [], jfw: [] };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setPanelOpen(true);
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-4">
      {/* Title */}
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl sm:text-2xl tracking-tight">Calendar</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Team report activity and JFW schedule</p>
      </div>

      {/* Month header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-poppins-extrabold text-[#222f36] tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              aria-label="Previous month"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              aria-label="Next month"
            >
              <MdChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); setPanelOpen(true); }}
            className="text-xs font-poppins-semibold px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            Today
          </button>
          {loading && <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin ml-1" />}
        </div>
        <div className="flex items-center gap-2">
          {monthReports > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] bg-[#dcfce7] px-3 py-1.5 rounded-full">
              <LuClipboardCheck className="w-3.5 h-3.5" />
              {monthReports} report{monthReports !== 1 ? "s" : ""}
            </div>
          )}
          {monthJfw > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-full">
              <LuUsers className="w-3.5 h-3.5" />
              {monthJfw} JFW
            </div>
          )}
        </div>
      </div>

      {/* Calendar + panel */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">

        {/* Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] sm:text-[11px] font-poppins-bold text-gray-400 uppercase tracking-wider py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {calDays.map((day) => {
              const key  = format(day, "yyyy-MM-dd");
              const data = dayMap[key] ?? { reports: [], jfw: [] };
              return (
                <DayCell
                  key={key}
                  day={day}
                  inMonth={isSameMonth(day, currentMonth)}
                  data={data}
                  selected={isSameDay(day, selectedDay)}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Approved report</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">Pending / Rejected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] text-gray-400 font-poppins-semibold">JFW session</span>
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <DayPanel
            day={selectedDay}
            data={selectedData}
            loading={loading}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerCalendar;
