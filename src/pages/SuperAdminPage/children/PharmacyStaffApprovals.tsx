import { useCallback, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiUsers } from "react-icons/fi";
import { getPendingStaffAdminApi, adminApproveStaffApi, rejectStaffApi } from "../../../services/api";

interface PharmacyStaffRecord {
  id: string; name: string; role: string; phone: string | null; notes: string | null;
  status: string; supervisor_approved_at: string | null; created_at: string;
  suggested_by: { id: string; firstname: string; lastname: string };
  supervisor_approved_by: { id: string; firstname: string; lastname: string } | null;
  pharmacy_links: Array<{ pharmacy: { id: string; pharmacy_name: string; town: string | null } }>;
}

const ROLE_COLOUR: Record<string, string> = {
  Dispenser:   "bg-violet-50 text-violet-700 border-violet-200",
  Pharmacist:  "bg-blue-50 text-blue-700 border-blue-200",
  Procurement: "bg-amber-50 text-amber-700 border-amber-200",
  Owner:       "bg-green-50 text-green-700 border-green-200",
  Manager:     "bg-gray-50 text-gray-600 border-gray-200",
};

const FMT = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const RejectInput = ({ onConfirm }: { onConfirm: (note: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
      style={{ transition: "background-color 0.15s" }}>
      <FiXCircle className="w-3.5 h-3.5" /> Reject
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      <input autoFocus value={note} onChange={e => setNote(e.target.value)}
        placeholder="Reason…"
        className="flex-1 text-xs font-poppins border border-red-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-400" />
      <button onClick={() => { if (note.trim()) onConfirm(note.trim()); }}
        className="px-3 py-1.5 text-xs font-poppins-bold rounded-lg bg-red-600 text-white hover:bg-red-700"
        style={{ transition: "opacity 0.15s" }}>Send</button>
      <button onClick={() => setOpen(false)} className="text-xs font-poppins text-gray-400 hover:text-gray-600">Cancel</button>
    </div>
  );
};

const PharmacyStaffApprovals = () => {
  const [staff, setStaff]       = useState<PharmacyStaffRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getPendingStaffAdminApi()
      .then(r => setStaff(r.data?.data ?? []))
      .catch(() => setError("Failed to load pending staff"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setActioning(id);
    await adminApproveStaffApi(id).catch(() => {});
    setStaff(p => p.filter(s => s.id !== id));
    setActioning(null);
  };

  const reject = async (id: string, note: string) => {
    setActioning(id);
    await rejectStaffApi(id, note).catch(() => {});
    setStaff(p => p.filter(s => s.id !== id));
    setActioning(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
          <FiUsers className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-poppins-bold text-[#1a1a1a] tracking-tight">Pharmacy Staff Approvals</h1>
          <p className="text-sm font-poppins text-gray-500">
            {loading ? "Loading…" : staff.length === 0 ? "All caught up — no pending approvals" : `${staff.length} record${staff.length !== 1 ? "s" : ""} awaiting final approval`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-600 font-poppins text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm font-poppins text-gray-400">Loading…</div>
      ) : staff.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
          <FiUsers className="w-10 h-10 opacity-30" />
          <p className="text-sm font-poppins-semibold">No records pending final approval</p>
          <p className="text-xs font-poppins text-gray-400">Supervisor-approved suggestions appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(s => {
            const pharmacy = s.pharmacy_links[0]?.pharmacy;
            const suggestedBy = `${s.suggested_by.firstname} ${s.suggested_by.lastname}`;
            const approvedBy = s.supervisor_approved_by
              ? `${s.supervisor_approved_by.firstname} ${s.supervisor_approved_by.lastname}`
              : null;
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-poppins-bold text-violet-700">{s.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-poppins-bold text-gray-800">{s.name}</p>
                      {s.phone && <p className="text-xs font-poppins text-gray-400">{s.phone}</p>}
                      {pharmacy && (
                        <p className="text-xs font-poppins text-gray-500">
                          {pharmacy.pharmacy_name}{pharmacy.town ? ` · ${pharmacy.town}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-poppins-bold px-2 py-0.5 rounded-full border ${ROLE_COLOUR[s.role] ?? ROLE_COLOUR.Manager}`}>
                    {s.role}
                  </span>
                </div>

                {s.notes && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-poppins text-gray-700 border border-gray-100">
                    <span className="text-xs font-poppins-semibold text-gray-400 block mb-0.5">Notes</span>
                    {s.notes}
                  </div>
                )}

                {/* Approval trail */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-poppins text-gray-400">
                  <span>Suggested by <span className="text-gray-600 font-poppins-semibold">{suggestedBy}</span> · {FMT(s.created_at)}</span>
                  {approvedBy && s.supervisor_approved_at && (
                    <span>Supervisor: <span className="text-gray-600 font-poppins-semibold">{approvedBy}</span> · {FMT(s.supervisor_approved_at)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => approve(s.id)} disabled={actioning === s.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-poppins-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
                    style={{ transition: "background-color 0.15s" }}>
                    <FiCheckCircle className="w-3.5 h-3.5" /> Approve to master list
                  </button>
                  <RejectInput onConfirm={note => reject(s.id, note)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PharmacyStaffApprovals;
