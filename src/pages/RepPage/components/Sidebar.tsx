import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useSelector } from "react-redux";
import { BiCalendar, BiFileBlank, BiHome, BiReceipt, BiMap } from "react-icons/bi";
import { IoSettingsOutline } from "react-icons/io5";
import { BsCardChecklist } from "react-icons/bs";
import { FaUserMd, FaHistory } from "react-icons/fa";
import { TbPill } from "react-icons/tb";
import { FaUserDoctor, FaLocationCrosshairs } from "react-icons/fa6";
import { MdOutlineEventRepeat, MdAdd, MdClose, MdCheckCircle } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import { BiLock, BiChevronDown, BiChevronUp } from "react-icons/bi";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfDay,
  isAfter,
  isSameDay,
} from "date-fns";
import LogVisitModal from "../../../componets/LogVisitModal/LogVisitModal";
import LogPharmacyModal from "../../../componets/LogPharmacyModal/LogPharmacyModal";
import Ncapopup from "../../../componets/NcaPoppup/Ncapopup";
import { NavLink, useNavigate } from "react-router-dom";
import { getActivityHistoryApi, getTodayTourPlanApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorActivity {
  id: string;
  date: string;
  doctor: { id: string; doctor_name: string; town?: string };
  outcome?: string;
}

// ─── Nav helpers ─────────────────────────────────────────────────────────────

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer flex flex-col gap-1 items-center transition-opacity duration-150 ${
    isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
  }`;

const iconClass = (isActive: boolean) =>
  `w-5 h-5 ${isActive ? "text-[#16a34a]" : "text-[#454545]"}`;

const labelClass = (isActive: boolean) =>
  `text-[11px] font-semibold tracking-wide ${isActive ? "text-[#16a34a]" : "text-[#454545]"}`;

// ─── Doctor initials avatar ───────────────────────────────────────────────────

const Initials = ({ name }: { name: string }) => {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-[#16a34a]">{letters}</span>
    </div>
  );
};

// ─── Doctor tile ─────────────────────────────────────────────────────────────

const DoctorTile = ({
  name,
  town,
  visited,
  label,
  onLogVisit,
  onNca,
  onViewProfile,
}: {
  name: string;
  town?: string;
  visited: boolean;
  label?: "planned" | "unplanned";
  onLogVisit?: () => void;
  onNca?: () => void;
  onViewProfile?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
      <Initials name={name} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#222f36] truncate">{name}</p>
        {town && <p className="text-[10px] text-gray-400 truncate">{town}</p>}
        {label && (
          <span className={
            `inline-block text-[9px] font-bold uppercase tracking-wide mt-0.5 px-1.5 py-px rounded-full ${
              label === "unplanned" ? "bg-amber-50 text-amber-600" : "bg-[#f0fdf4] text-[#16a34a]"
            }`
          }>
            {label}
          </span>
        )}
      </div>

      {visited ? (
        <MdCheckCircle className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
      ) : (
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center hover:bg-[#15803d] focus-visible:outline-none shadow-sm"
            aria-label="Actions"
          >
            <MdAdd className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-50 bg-white rounded-xl border border-gray-100 overflow-hidden w-40 py-0.5"
              style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
            >
              {onLogVisit && (
                <button
                  onClick={() => { onLogVisit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline-none"
                >
                  <MdCheckCircle className="w-3.5 h-3.5 shrink-0" />
                  Log Visit
                </button>
              )}
              {onNca && (
                <button
                  onClick={() => { onNca(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 focus-visible:outline-none border-t border-gray-50"
                >
                  <IoWarningOutline className="w-3.5 h-3.5 shrink-0" />
                  Flag NCA
                </button>
              )}
              {onViewProfile && (
                <button
                  onClick={() => { onViewProfile(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none border-t border-gray-50"
                >
                  <FaUserDoctor className="w-3.5 h-3.5 shrink-0" />
                  View Profile
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Pharmacy tile ───────────────────────────────────────────────────────────

const PharmacyTile = ({
  name,
  town,
  slot,
  visited,
  onLogPharmacy,
}: {
  name: string;
  town?: string;
  slot?: string;
  visited?: boolean;
  onLogPharmacy?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
      <TbPill className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#222f36] truncate">{name}</p>
        {town && <p className="text-[10px] text-gray-400 truncate">{town}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-semibold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
          {slot === "MORNING" ? "AM" : "PM"}
        </span>
        {visited ? (
          <MdCheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0" />
        ) : onLogPharmacy && (
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 focus-visible:outline-none shadow-sm"
              aria-label="Log pharmacy visit"
            >
              <MdAdd className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 bg-white rounded-xl border border-gray-100 overflow-hidden w-36 py-0.5"
                   style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}>
                <button
                  onClick={() => { onLogPharmacy(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 focus-visible:outline-none"
                >
                  <TbPill className="w-3.5 h-3.5 shrink-0" />
                  Log Visit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Add-entry modal ──────────────────────────────────────────────────────────

type FormTab = "unplanned" | "leave";

const AddEntryModal = ({
  day,
  onClose,
  onOpenLogVisit,
}: {
  day: Date;
  onClose: () => void;
  onOpenLogVisit?: () => void;
}) => {
  const [tab, setTab] = useState<FormTab>("unplanned");

  // Unplanned visit fields
  const [doctorName, setDoctorName] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  // Leave fields
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveNotes, setLeaveNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (tab === "unplanned") {
        // Open the proper Log Visit modal which has full doctor search + product
        onClose();
        onOpenLogVisit?.();
        return;
      }
      // Leave / NCA — just close for now (no backend for day-off yet)
      onClose();
    },
    [tab, onClose, onOpenLogVisit]
  );

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[340px] max-w-[90vw] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Add Entry</p>
            <h2 className="text-sm font-bold text-[#222f36]">{format(day, "dd MMM — EEEE")}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            <MdClose className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-gray-100">
          {(["unplanned", "leave"] as FormTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none ${
                tab === t
                  ? "text-[#16a34a] border-b-2 border-[#16a34a]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "unplanned" ? "Unplanned Visit" : "Leave / NCA"}
            </button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          {tab === "unplanned" ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Doctor name</label>
                <input
                  type="text"
                  placeholder="Dr. Kato"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea
                  placeholder="Outcome, products discussed…"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !doctorName.trim()}
                className="w-full py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                {"Open Log Visit Form →"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Leave type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white transition-colors"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Public Holiday</option>
                  <option>NCA — No Customers Available</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea
                  placeholder="Reason or details…"
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 text-sm font-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
              >
                {submitting ? "Submitting…" : "Submit Leave"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

// ─── Today plan entry type ───────────────────────────────────────────────────

interface TodayPlanEntry {
  id: string;
  entry_type: "CLINICIAN" | "PHARMACY";
  slot: "MORNING" | "EVENING";
  doctor_id: string | null;
  doctor?: { id: string; doctor_name: string; town?: string } | null;
  pharmacy_id: string | null;
  pharmacy_name: string | null;
  pharmacy?: { id: string; pharmacy_name: string; location: string; town?: string } | null;
}

// ─── Day row ──────────────────────────────────────────────────────────────────

interface DayRowProps {
  day: Date;
  activities: DayActivity[];
  todayPlanEntries: TodayPlanEntry[];  // tour plan entries for today (empty for other days)
  onAddClick: (day: Date) => void;
  onLogVisit?:    (doctorId: string, doctorName: string) => void;
  onNca?:         (doctorId: string, doctorName: string) => void;
  onViewProfile?: (doctorId: string, doctorName: string) => void;
  onLogPharmacy?: (pharmacyId: string, pharmacyName: string, location?: string) => void;
}

interface DayActivity {
  id: string;
  doctorId: string;
  doctorName: string;
  town?: string;
  visitType?: string; // "PLANNED" | "UNPLANNED"
}

const DayRow = ({ day, activities, todayPlanEntries, onAddClick, onLogVisit, onNca, onViewProfile, onLogPharmacy, visitedPharmacyIds }: DayRowProps) => {
  const today = startOfDay(new Date());
  const dayStart = startOfDay(day);
  const isFuture = isAfter(dayStart, today);
  const isToday = isSameDay(dayStart, today);

  const [expanded, setExpanded] = useState(isToday); // today opens by default

  const label = format(day, "dd MMM — EEEE");
  const visitedDoctorIds = new Set(activities.map((a) => a.doctorId));

  // Today: show cycle doctors (planned) + unplanned activities
  // Past: show all logged activities only
  const plannedTiles = isToday
    ? todayPlanEntries.map((entry) => ({
        key: entry.id,
        doctorId:   entry.entry_type === "CLINICIAN" ? (entry.doctor_id ?? "") : "",
        pharmacyId: entry.entry_type === "PHARMACY"  ? (entry.pharmacy_id ?? "") : "",
        name: entry.entry_type === "CLINICIAN"
          ? (entry.doctor?.doctor_name ?? "Unknown")
          : (entry.pharmacy?.pharmacy_name ?? entry.pharmacy_name ?? "Unknown Pharmacy"),
        location: entry.entry_type === "PHARMACY"
          ? [entry.pharmacy?.location, entry.pharmacy?.town].filter(Boolean).join(" · ")
          : undefined,
        town: entry.entry_type === "CLINICIAN"
          ? entry.doctor?.town
          : [entry.pharmacy?.location, entry.pharmacy?.town].filter(Boolean).join(" · "),
        visited: entry.entry_type === "CLINICIAN"
          ? visitedDoctorIds.has(entry.doctor_id ?? "")
          : visitedPharmacyIds.includes(entry.pharmacy_id ?? ""),
        label: "planned" as const,
        entryType: entry.entry_type,
        slot: entry.slot,
      }))
    : [];

  const activityTiles = activities
    .filter((a) => !isToday || !plannedTiles.some((p) => p.doctorId === a.doctorId))
    .map((a) => ({
      key: a.id,
      doctorId: a.doctorId,
      name: a.doctorName,
      town: a.town,
      visited: true,
      label: (a.visitType === "UNPLANNED" ? "unplanned" : undefined) as "unplanned" | undefined,
    }));

  const allTiles = [...plannedTiles, ...activityTiles];
  const visitCount = activities.length;
  const hasContent = allTiles.length > 0;

  return (
    <div className="border-b border-gray-200">
      {/* header row */}
      <div
        className={`w-full px-2.5 flex items-center h-[50px] gap-2 ${
          isFuture ? "bg-[#f8f6f6]" : "bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        }`}
        onClick={() => !isFuture && setExpanded((x) => !x)}
      >
        {/* expand chevron — only on accessible days */}
        {!isFuture && (
          <span className="text-gray-300 flex-shrink-0">
            {expanded ? (
              <BiChevronUp className="w-4 h-4" />
            ) : (
              <BiChevronDown className="w-4 h-4" />
            )}
          </span>
        )}

        <h1
          className={`flex-1 font-semibold text-sm truncate ${
            isToday ? "text-[#16a34a]" : isFuture ? "text-gray-400" : "text-[#222f36]"
          }`}
        >
          {label}
          {visitCount > 0 && (
            <span className="ml-1.5 text-[10px] font-bold text-gray-400">({visitCount})</span>
          )}
        </h1>

        {isFuture ? (
          <BiLock className="w-4 h-4 text-gray-300 flex-shrink-0" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(day);
            }}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-[#16a34a] hover:bg-green-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] flex-shrink-0"
            aria-label="Add entry"
          >
            <MdAdd className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* expanded doctor list */}
      {expanded && (
        <div className="bg-white border-t border-gray-50">
          {!hasContent ? (
            <div className="flex flex-col items-center py-4 text-gray-300">
              <FaUserDoctor className="w-6 h-6 mb-1 opacity-40" />
              <p className="text-xs">No visits logged</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allTiles.map((tile) => (
                (tile as any).entryType === "PHARMACY" ? (
                  <PharmacyTile
                    key={tile.key}
                    name={tile.name}
                    town={tile.town}
                    slot={(tile as any).slot}
                    onLogPharmacy={(tile as any).pharmacyId && onLogPharmacy
                      ? () => onLogPharmacy((tile as any).pharmacyId, tile.name, (tile as any).location)
                      : undefined}
                  />
                ) : (
                  <DoctorTile
                    key={tile.key}
                    name={tile.name}
                    town={tile.town}
                    visited={tile.visited}
                    label={tile.label ?? (isToday ? "planned" : undefined)}
                    onLogVisit={!tile.visited && tile.doctorId && onLogVisit
                      ? () => onLogVisit(tile.doctorId, tile.name)
                      : undefined}
                    onNca={!tile.visited && tile.doctorId && onNca
                      ? () => onNca(tile.doctorId, tile.name)
                      : undefined}
                    onViewProfile={tile.doctorId && onViewProfile
                      ? () => onViewProfile(tile.doctorId, tile.name)
                      : undefined}
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const showPanel = useSelector((state: any) => state.uiState.showSidebarPanel);
  const [activitiesByDay, setActivitiesByDay] = useState<Record<string, DayActivity[]>>({});
  const [todayPlanEntries, setTodayPlanEntries] = useState<TodayPlanEntry[]>([]);
  const [modalDay, setModalDay] = useState<Date | null>(null);
  const [visitModal,  setVisitModal]  = useState<{ doctorId: string; doctorName: string } | null>(null);
  const [ncaModal,    setNcaModal]    = useState<{ doctorId: string; doctorName: string } | null>(null);
  const [pharmModal,  setPharmModal]  = useState<{ pharmacyId: string; pharmacyName: string; location?: string } | null>(null);
  const [visitedPharmacyIds, setVisitedPharmacyIds] = useState<string[]>([]);
  const todayRowRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll today's row to vertical center on mount and when panel opens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRowRef.current && scrollContainerRef.current) {
        const COLLAPSED_ROW_H = 50;
        const todayTop = todayRowRef.current.offsetTop;
        scrollContainerRef.current.scrollTop = Math.max(0, todayTop - COLLAPSED_ROW_H * 2);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [showPanel]);

  useEffect(() => {
    Promise.all([
      getActivityHistoryApi({ days: 31, limit: 500 }),
      getTodayTourPlanApi(),
    ])
      .then(([histRes, planRes]) => {
        const activities: DoctorActivity[] = histRes.data?.data ?? [];
        const byDay: Record<string, DayActivity[]> = {};
        for (const a of activities) {
          const key = format(new Date(a.date), "yyyy-MM-dd");
          if (!byDay[key]) byDay[key] = [];
          byDay[key].push({
            id: a.id,
            doctorId: a.doctor?.id ?? "",
            doctorName: a.doctor?.doctor_name ?? "Unknown",
            town: a.doctor?.town,
            visitType: (a as any).visit_type,
          });
        }
        setActivitiesByDay(byDay);

        const entries: TodayPlanEntry[] = planRes.data?.data ?? [];
        setTodayPlanEntries(entries);
      })
      .catch(() => {
        // silently ignore — UI degrades gracefully
      });
  }, []);

  const monthDays = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  }, []);

  const handleAddClick = useCallback((day: Date) => {
    setModalDay(day);
  }, []);

  return (
    <div
      className="hidden md:flex bg-white h-screen fixed shadow overflow-hidden"
      style={{
        width: showPanel ? 380 : 88,
        transition: "width 250ms ease",
      }}
    >
      {/* left nav strip */}
      <div className="w-[88px] pt-4 pb-10 flex flex-col items-center h-full border-r border-gray-200 shrink-0 overflow-y-auto scrollbar-none">
        <div className="flex flex-col gap-5 items-center flex-1">
          <NavLink to="/rep-page" end>
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BiHome className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>HOME</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/tasks">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BsCardChecklist className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>TASKS</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/visits">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <FaHistory className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>VISITS</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/doctors">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <FaUserMd className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>DOCTORS</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/call-cycle">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <MdOutlineEventRepeat className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>CYCLE</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/tour-plan">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BiMap className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>TOUR</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/reports">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BiFileBlank className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>REPORTS</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/expenses">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BiReceipt className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>CLAIMS</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/calendar">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <BiCalendar className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>CALENDAR</p>
              </div>
            )}
          </NavLink>

          <NavLink to="/rep-page/near-me">
            {({ isActive }) => (
              <div className={navLinkClass({ isActive })}>
                <FaLocationCrosshairs className={iconClass(isActive)} />
                <p className={labelClass(isActive)}>MAP</p>
              </div>
            )}
          </NavLink>
        </div>

        <div className="w-10 border-t border-gray-200 mt-auto mb-4" />

        <NavLink to="/rep-page/settings" className="mb-6">
          {({ isActive }) => (
            <div className={navLinkClass({ isActive })}>
              <IoSettingsOutline className={iconClass(isActive)} />
              <p className={labelClass(isActive)}>SETTINGS</p>
            </div>
          )}
        </NavLink>
      </div>

      {/* right column — hidden when panel is collapsed */}
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: showPanel ? "calc(380px - 88px)" : 0,
          opacity: showPanel ? 1 : 0,
          transition: "width 250ms ease, opacity 200ms ease",
          pointerEvents: showPanel ? "auto" : "none",
        }}
      >
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {monthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(startOfDay(day), startOfDay(new Date()));
            return (
              <div key={key} ref={isToday ? todayRowRef : undefined}>
                <DayRow
                  day={day}
                  activities={activitiesByDay[key] ?? []}
                  todayPlanEntries={isToday ? todayPlanEntries : []}
                  onAddClick={handleAddClick}
                  onLogVisit={(id, name) => setVisitModal({ doctorId: id, doctorName: name })}
                  onNca={(id, name) => setNcaModal({ doctorId: id, doctorName: name })}
                  onViewProfile={(id) => navigate(`/rep-page/doctors?highlight=${id}`)}
                  onLogPharmacy={(id, name, loc) => setPharmModal({ pharmacyId: id, pharmacyName: name, location: loc })}
                  visitedPharmacyIds={visitedPharmacyIds}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* modal — rendered to body via portal */}
      {modalDay && (
        <AddEntryModal day={modalDay} onClose={() => setModalDay(null)} onOpenLogVisit={() => setVisitModal({ doctorId: "", doctorName: "" })} />
      )}

      {/* Log Visit modal — triggered from sidebar chip */}
      {visitModal && (
        <LogVisitModal
          initialDoctorId={visitModal.doctorId}
          initialDoctorLabel={visitModal.doctorName}
          onClose={() => setVisitModal(null)}
          onSuccess={() => {
            setVisitModal(null);
            // Refresh activity history so the chip updates to visited
            getTodayTourPlanApi(); // trigger sidebar re-fetch via parent if needed
          }}
        />
      )}

      {/* NCA modal — triggered from sidebar chip */}
      {ncaModal && (
        <Ncapopup
          initialDoctorId={ncaModal.doctorId}
          initialDoctorLabel={ncaModal.doctorName}
          onClose={() => setNcaModal(null)}
          onSuccess={() => setNcaModal(null)}
        />
      )}

      {/* Log Pharmacy modal — triggered from pharmacy chip */}
      {pharmModal && (
        <LogPharmacyModal
          pharmacyId={pharmModal.pharmacyId}
          pharmacyName={pharmModal.pharmacyName}
          pharmacyLocation={pharmModal.location}
          onClose={() => setPharmModal(null)}
          onSuccess={() => {
            const id = pharmModal?.pharmacyId;
            if (id) setVisitedPharmacyIds((prev) => [...prev, id]);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
