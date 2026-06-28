import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebarPanel } from "../../../store/uiStateSlice";
import { BiCalendar, BiFileBlank, BiHome, BiReceipt, BiMap, BiCoffee, BiBook } from "react-icons/bi";
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
import { getActivityHistoryApi, getTodayTourPlanApi, getCompanyDoctorListApi, getPharmacyActivityHistoryApi } from "../../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorActivity {
  id: string;
  date: string;
  doctor: { id: string; doctor_name: string; town?: string };
  outcome?: string;
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

const NavItem = ({ to, icon: Icon, label, end }: NavItemProps) => (
  <NavLink to={to} end={end} className="block">
    {({ isActive }) => (
      <div
        className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150 ${isActive ? "bg-[#f0fdf4]" : "hover:bg-gray-100"
          }`}
      >
        <Icon
          className={`w-[22px] h-[22px] transition-colors duration-150 ${isActive ? "text-[#16a34a]" : "text-gray-400 group-hover:text-[#222f36]"
            }`}
        />
        <span
          className="pointer-events-none absolute left-12 z-[60] hidden group-hover:flex items-center bg-[#222f36] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
        >
          {label}
          {isActive && <span className="ml-1.5 w-1 h-1 rounded-full bg-[#16a34a] inline-block" />}
        </span>
      </div>
    )}
  </NavLink>
);

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
        <p className="text-xs font-poppins-semibold text-[#222f36] truncate">{name}</p>
        {town && <p className="text-[10px] text-gray-400 truncate">{town}</p>}
        {label && (
          <span className={
            `inline-block text-[9px] font-poppins-bold uppercase tracking-wide mt-0.5 px-1.5 py-px rounded-full ${label === "unplanned" ? "bg-amber-50 text-amber-600" : "bg-[#f0fdf4] text-[#16a34a]"
            }`
          }>{label}</span>
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
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-poppins-semibold text-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline-none"
                >
                  <MdCheckCircle className="w-3.5 h-3.5 shrink-0" />
                  Log Visit
                </button>
              )}
              {onNca && (
                <button
                  onClick={() => { onNca(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-poppins-semibold text-amber-600 hover:bg-amber-50 focus-visible:outline-none border-t border-gray-50"
                >
                  <IoWarningOutline className="w-3.5 h-3.5 shrink-0" />
                  Flag NCA
                </button>
              )}
              {onViewProfile && (
                <button
                  onClick={() => { onViewProfile(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-poppins-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none border-t border-gray-50"
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
        <p className="text-xs font-poppins-semibold text-[#222f36] truncate">{name}</p>
        {town && <p className="text-[10px] text-gray-400 truncate">{town}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-poppins-semibold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
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
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-poppins-semibold text-violet-600 hover:bg-violet-50 focus-visible:outline-none"
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

interface DoctorOption { id: string; doctor_name: string; town?: string; }

const AddEntryModal = ({
  day,
  todayPlanEntries = [],
  onClose,
  onOpenLogVisit,
}: {
  day: Date;
  todayPlanEntries?: TodayPlanEntry[];
  onClose: () => void;
  onOpenLogVisit?: (doctorId?: string, doctorName?: string) => void;
}) => {
  const [tab, setTab] = useState<FormTab>("unplanned");

  // Doctor search
  const [doctors, setDoctors]         = useState<DoctorOption[]>([]);
  const [search, setSearch]           = useState("");
  const [selectedId, setSelectedId]   = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [showList, setShowList]       = useState(false);
  const [plannedWarning, setPlannedWarning] = useState(false);

  // Leave fields
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [submitting] = useState(false);

  useEffect(() => {
    getCompanyDoctorListApi().then((r) => {
      const raw = r.data.data ?? r.data ?? [];
      setDoctors(raw.map((item: any) => item.doctor ?? item));
    }).catch(() => {});
  }, []);

  const filtered = search.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.town?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSelect = (d: DoctorOption) => {
    setSelectedId(d.id);
    setSelectedLabel(`${d.doctor_name} — ${d.town ?? ""}`);
    setSearch("");
    setShowList(false);
    // Check if this doctor is already on today's tour plan
    const isPlanned = todayPlanEntries.some(
      (e) => e.entry_type === "CLINICIAN" && e.doctor_id === d.id
    );
    if (isPlanned) setPlannedWarning(true);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (tab === "unplanned") {
        onClose();
        onOpenLogVisit?.(selectedId || undefined, selectedLabel || undefined);
        return;
      }
      onClose();
    },
    [tab, onClose, onOpenLogVisit, selectedId, selectedLabel]
  );

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[340px] max-w-[90vw] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-[11px] font-poppins text-gray-400 font-medium uppercase tracking-wide">Add Entry</p>
            <h2 className="text-sm font-poppins-bold text-[#222f36]">{format(day, "dd MMM — EEEE")}</h2>
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
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none ${tab === t
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
              <div className="relative">
                <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">
                  Search doctor <span className="text-gray-400 font-normal">(optional — you can also search in the next step)</span>
                </label>
                <input
                  type="text"
                  placeholder="Type name or town…"
                  value={selectedLabel || search}
                  onChange={(e) => {
                    setSelectedId("");
                    setSelectedLabel("");
                    setSearch(e.target.value);
                    setShowList(true);
                  }}
                  onFocus={() => setShowList(true)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-colors"
                />
                {showList && filtered.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl w-full mt-1 max-h-44 overflow-y-auto shadow-lg custom-scrollbar">
                    {filtered.map((d) => (
                      <li
                        key={d.id}
                        onMouseDown={() => handleSelect(d)}
                        className="px-3 py-2.5 hover:bg-green-50 cursor-pointer text-sm flex items-center justify-between"
                      >
                        <span className="font-poppins-semibold text-[#222f36]">{d.doctor_name}</span>
                        {d.town && <span className="text-xs text-gray-400 ml-2">{d.town}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {showList && search.length >= 2 && filtered.length === 0 && (
                  <div className="absolute z-10 bg-white border border-gray-200 rounded-xl w-full mt-1 px-3 py-2.5 text-sm text-gray-400 shadow">
                    No doctors found
                  </div>
                )}
              </div>
              {/* Planned-doctor warning */}
              {plannedWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 flex flex-col gap-2">
                  <p className="text-xs font-poppins-semibold text-amber-800">
                    ⚠️ {selectedLabel.split(" —")[0]} is already on your plan for today.
                  </p>
                  <p className="text-[11px] font-poppins text-amber-700 leading-snug">
                    Logging a second visit will mark it as unplanned. You can also proceed directly to the planned tile.
                  </p>
                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 text-xs font-poppins-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg focus-visible:outline-none"
                    >
                      Log anyway (unplanned)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedId(""); setSelectedLabel(""); setPlannedWarning(false); }}
                      className="flex-1 py-1.5 text-xs font-poppins-semibold text-amber-700 bg-white border border-amber-200 hover:bg-amber-50 rounded-lg focus-visible:outline-none"
                    >
                      Choose different doctor
                    </button>
                  </div>
                </div>
              )}

              {!plannedWarning && (
                <button
                  type="submit"
                  className="w-full py-2 text-sm font-poppins-semibold text-white bg-[#16a34a] rounded-xl hover:bg-[#15803d] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                >
                  {selectedId ? `Log unplanned visit — ${selectedLabel.split(" —")[0]} →` : "Open Log Visit Form →"}
                </button>
              )}
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
  onLogVisit?: (doctorId: string, doctorName: string) => void;
  onNca?: (doctorId: string, doctorName: string) => void;
  onViewProfile?: (doctorId: string, doctorName: string) => void;
  onLogPharmacy?: (pharmacyId: string, pharmacyName: string, location?: string) => void;
  visitedPharmacyIds: string[];
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
      doctorId: entry.entry_type === "CLINICIAN" ? (entry.doctor_id ?? "") : "",
      pharmacyId: entry.entry_type === "PHARMACY" ? (entry.pharmacy_id ?? "") : "",
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
      // activityTiles are visits to doctors NOT on the tour plan — always unplanned for today
      label: isToday ? "unplanned" as const : undefined,
    }));

  const allTiles = [...plannedTiles, ...activityTiles];
  const visitCount = activities.length;
  const hasContent = allTiles.length > 0;

  return (
    <div className="border-b border-gray-200">
      {/* header row */}
      <div
        className={`w-full px-2.5 flex items-center h-[50px] gap-2 ${isFuture ? "bg-[#f8f6f6]" : "bg-white hover:bg-gray-50 cursor-pointer transition-colors"
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
          className={`flex-1 font-poppins-semibold text-[13px] truncate ${isToday ? "text-[#16a34a]" : isFuture ? "text-gray-400" : "text-[#222f36]"
            }`}
        >
          {label}
          {visitCount > 0 && (
            <span className="ml-1.5 text-[10px] font-poppins-bold text-gray-400">({visitCount})</span>
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
                    visited={tile.visited}
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
  const dispatch = useDispatch();
  const showPanel = useSelector((state: any) => state.uiState.showSidebarPanel);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [activitiesByDay, setActivitiesByDay] = useState<Record<string, DayActivity[]>>({});
  const [todayPlanEntries, setTodayPlanEntries] = useState<TodayPlanEntry[]>([]);
  const [modalDay, setModalDay] = useState<Date | null>(null);
  const [visitModal, setVisitModal] = useState<{ doctorId: string; doctorName: string } | null>(null);
  const [ncaModal, setNcaModal] = useState<{ doctorId: string; doctorName: string } | null>(null);
  const [pharmModal, setPharmModal] = useState<{ pharmacyId: string; pharmacyName: string; location?: string } | null>(null);
  const [visitedPharmacyIds, setVisitedPharmacyIds] = useState<string[]>([]);
  const todayRowRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    const todayKey = format(new Date(), "yyyy-MM-dd");

    Promise.all([
      getActivityHistoryApi({ days: 31, limit: 500 }),
      getTodayTourPlanApi(),
      getPharmacyActivityHistoryApi({ days: 1, limit: 200 }),
    ])
      .then(([histRes, planRes, pharmRes]) => {
        // Doctor activities
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

        // Tour plan
        const entries: TodayPlanEntry[] = planRes.data?.data ?? [];
        setTodayPlanEntries(entries);

        // Seed visitedPharmacyIds from today's pharmacy activities so the
        // tick persists across page refreshes
        const pharmActivities: any[] = pharmRes.data?.data ?? [];
        const todayVisitedIds = pharmActivities
          .filter((a) => format(new Date(a.date), "yyyy-MM-dd") === todayKey)
          .map((a) => a.pharmacy_id)
          .filter(Boolean);
        if (todayVisitedIds.length > 0) {
          setVisitedPharmacyIds(todayVisitedIds);
        }
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
    // On mobile close the overlay so the modal renders on clean screen
    if (isMobile && showPanel) dispatch(toggleSidebarPanel());
    setModalDay(day);
  }, [isMobile, showPanel, dispatch]);

  return (
    <>
      {/* Mobile backdrop — tap outside to close */}
      {isMobile && showPanel && (
        <div
          className="fixed inset-0 z-[149] bg-black/30"
          onClick={() => dispatch(toggleSidebarPanel())}
        />
      )}
      <div
        className="flex bg-white fixed shadow"
      style={{
        top: isMobile ? 56 : 64,
        height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)',
        width: isMobile ? 280 : (showPanel ? 320 : 72),
        zIndex: isMobile ? 150 : 100,
        transform: isMobile ? (showPanel ? 'translateX(0)' : 'translateX(-100%)') : undefined,
        transition: isMobile ? "transform 250ms ease" : "width 250ms ease",
      }}
    >
      {/* left nav strip — desktop only, hidden on mobile */}
      <div className={`${isMobile ? "hidden" : "flex"} w-[72px] flex-col h-full border-r border-gray-200 shrink-0 bg-white`}>
        {/* scrollable nav items */}
        <div className="flex-1 overflow-y-auto scrollbar-none py-3 flex flex-col items-center gap-0.5">
          <NavItem to="/rep-page" icon={BiHome} label="Home" end />
          <NavItem to="/rep-page/tasks" icon={BsCardChecklist} label="Tasks" />
          <NavItem to="/rep-page/visits" icon={FaHistory} label="Visit History" />

          <div className="w-8 h-px bg-gray-100 my-1.5" />

          <NavItem to="/rep-page/doctors" icon={FaUserMd} label="HCP Directory" />
          <NavItem to="/rep-page/call-cycle" icon={MdOutlineEventRepeat} label="Call Cycle" />
          <NavItem to="/rep-page/tour-plan" icon={BiMap} label="Tour Plan" />

          <div className="w-8 h-px bg-gray-100 my-1.5" />

          <NavItem to="/rep-page/reports" icon={BiFileBlank} label="Reports" />
          <NavItem to="/rep-page/library" icon={BiBook} label="Library" />
          <NavItem to="/rep-page/expenses" icon={BiReceipt} label="Expense Claims" />
          <NavItem to="/rep-page/calendar" icon={BiCalendar} label="Calendar" />

          <div className="w-8 h-px bg-gray-100 my-1.5" />

          <NavItem to="/rep-page/events" icon={BiCoffee} label="Field Events" />
          <NavItem to="/rep-page/near-me" icon={FaLocationCrosshairs} label="Near Me" />
        </div>

        {/* settings — always pinned to bottom */}
        <div className="border-t border-gray-100 py-3 flex flex-col items-center">
          <NavItem to="/rep-page/settings" icon={IoSettingsOutline} label="Settings" />
        </div>
      </div>

      {/* right column — hidden when panel is collapsed */}
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: isMobile ? (showPanel ? "280px" : 0) : (showPanel ? "calc(320px - 72px)" : 0),
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
                  onLogVisit={(id, name) => {
                    if (isMobile && showPanel) dispatch(toggleSidebarPanel());
                    setVisitModal({ doctorId: id, doctorName: name });
                  }}
                  onNca={(id, name) => {
                    if (isMobile && showPanel) dispatch(toggleSidebarPanel());
                    setNcaModal({ doctorId: id, doctorName: name });
                  }}
                  onViewProfile={(id) => {
                    if (isMobile && showPanel) dispatch(toggleSidebarPanel());
                    navigate(`/rep-page/doctors?highlight=${id}`);
                  }}
                  onLogPharmacy={(id, name, loc) => {
                    if (isMobile && showPanel) dispatch(toggleSidebarPanel());
                    setPharmModal({ pharmacyId: id, pharmacyName: name, location: loc });
                  }}
                  visitedPharmacyIds={visitedPharmacyIds}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>

    {/* Portals — rendered directly to body so CSS transform on sidebar never traps them */}
    {modalDay && ReactDOM.createPortal(
      <AddEntryModal
        day={modalDay}
        todayPlanEntries={isSameDay(modalDay, new Date()) ? todayPlanEntries : []}
        onClose={() => setModalDay(null)}
        onOpenLogVisit={(doctorId, doctorName) => {
          setModalDay(null);
          setVisitModal({ doctorId: doctorId ?? "", doctorName: doctorName ?? "" });
        }}
      />,
      document.body
    )}

    {visitModal && ReactDOM.createPortal(
      <LogVisitModal
        initialDoctorId={visitModal.doctorId}
        initialDoctorLabel={visitModal.doctorName}
        onClose={() => setVisitModal(null)}
        onSuccess={() => setVisitModal(null)}
      />,
      document.body
    )}

    {ncaModal && ReactDOM.createPortal(
      <Ncapopup
        initialDoctorId={ncaModal.doctorId}
        initialDoctorLabel={ncaModal.doctorName}
        onClose={() => setNcaModal(null)}
        onSuccess={() => setNcaModal(null)}
      />,
      document.body
    )}

    {pharmModal && ReactDOM.createPortal(
      <LogPharmacyModal
        pharmacyId={pharmModal.pharmacyId}
        pharmacyName={pharmModal.pharmacyName}
        pharmacyLocation={pharmModal.location}
        onClose={() => setPharmModal(null)}
        onSuccess={() => {
          const id = pharmModal?.pharmacyId;
          if (id) setVisitedPharmacyIds((prev) => [...prev, id]);
          setPharmModal(null);
        }}
      />,
      document.body
    )}
    </>
  );
};

export default Sidebar;
