import { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import { BsCalendarX } from "react-icons/bs";
import { getCompanyDoctorListApi, logMissedVisitApi } from "../../services/api";

type VisitStatus = "MISSED" | "RESCHEDULED" | "SKIPPED";

interface LogMissedModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialDoctorId?: string;
  initialDoctorLabel?: string;
}

const STATUS_OPTIONS: { value: VisitStatus; label: string; desc: string; color: string }[] = [
  { value: "MISSED",      label: "Missed",      desc: "Doctor was unavailable or not seen",          color: "border-red-300 bg-red-50 text-red-700"    },
  { value: "RESCHEDULED", label: "Rescheduled", desc: "Doctor asked to move the meeting",            color: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "SKIPPED",     label: "Skipped",     desc: "Rep decided not to visit for other reasons", color: "border-gray-300 bg-gray-50 text-gray-600"  },
];

const MISS_REASONS: Record<VisitStatus, string[]> = {
  MISSED:      ["Not available", "Clinic closed", "In surgery / ward round", "Patient emergency", "Other"],
  RESCHEDULED: ["Doctor request", "Moved to next week", "Facility closed today", "Other"],
  SKIPPED:     ["Traffic / logistics", "Priority change", "Low tier, will catch up", "Other"],
};

const LogMissedModal = ({ onClose, onSuccess, initialDoctorId = "", initialDoctorLabel = "" }: LogMissedModalProps) => {
  const [doctors,     setDoctors]     = useState<{ id: string; doctor_name: string; town: string }[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showList,    setShowList]    = useState(false);
  const [doctorId,    setDoctorId]    = useState(initialDoctorId);
  const [doctorLabel, setDoctorLabel] = useState(initialDoctorLabel);
  const [status,      setStatus]      = useState<VisitStatus>("MISSED");
  const [reason,      setReason]      = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    getCompanyDoctorListApi().then((r) => setDoctors(r.data.data ?? r.data)).catch(() => {});
  }, []);

  const filteredDoctors = doctorSearch.length >= 2
    ? doctors.filter((d) =>
        d.doctor_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.town?.toLowerCase().includes(doctorSearch.toLowerCase()))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) { setError("Select a doctor first"); return; }
    setError("");
    setLoading(true);
    const finalReason = reason === "Other" ? customReason : reason;
    try {
      await logMissedVisitApi({
        doctor_id:    doctorId,
        visit_status: status,
        miss_reason:  finalReason || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to log. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const activeStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-amber-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <BsCalendarX className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl leading-none">Log Missed Visit</h2>
              <p className="text-amber-100 text-[11px] mt-0.5">Record why a planned call didn't happen</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
          )}

          {/* Doctor */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Doctor <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="Search by name or town…"
              value={doctorLabel || doctorSearch}
              onChange={(e) => { setDoctorLabel(""); setDoctorId(""); setDoctorSearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {showList && filteredDoctors.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg w-full mt-1 max-h-44 overflow-y-auto custom-scrollbar shadow-lg">
                {filteredDoctors.map((doc) => (
                  <li key={doc.id} className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm"
                    onMouseDown={() => { setDoctorId(doc.id); setDoctorLabel(`${doc.doctor_name} — ${doc.town}`); setDoctorSearch(""); setShowList(false); }}>
                    <span className="font-medium">{doc.doctor_name}</span>
                    {doc.town && <span className="text-gray-400 ml-2 text-xs">{doc.town}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What happened?</label>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => { setStatus(opt.value); setReason(""); }}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left ${
                    status === opt.value ? opt.color + ' border-opacity-100' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  style={{ transition: 'border-color 0.15s, background-color 0.15s' }}>
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    status === opt.value ? 'border-current' : 'border-gray-300'
                  }`}>
                    {status === opt.value && <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-none">{opt.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (optional)</label>
            <div className="flex flex-wrap gap-2">
              {MISS_REASONS[status].map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    reason === r
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400'
                  }`}
                  style={{ transition: 'background-color 0.15s, color 0.15s, border-color 0.15s' }}>
                  {r}
                </button>
              ))}
            </div>
            {reason === "Other" && (
              <input type="text" placeholder="Describe the reason…"
                value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              style={{ transition: 'opacity 0.15s' }}>
              {loading ? "Saving…" : `Log as ${activeStatus.label}`}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm"
              style={{ transition: 'background-color 0.15s' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogMissedModal;
