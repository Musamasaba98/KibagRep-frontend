import { useEffect, useState } from "react";
import { LuUsers, LuChevronDown, LuChevronUp, LuCalendarDays, LuStar, LuCheck } from "react-icons/lu";
import { TbActivityHeartbeat } from "react-icons/tb";
import { getJfwReportsApi, getDailyReportActivitiesApi, submitJfwScoreApi } from "../../../services/api";

interface JfwReport {
  id: string;
  report_date: string;
  visits_count: number;
  samples_count: number;
  summary: string | null;
  user: { id: string; firstname: string; lastname: string };
}

interface Activity {
  id: string;
  visit_type: "PLANNED" | "UNPLANNED" | "NCA";
  samples_given: number;
  nca_reason: string | null;
  doctor: { doctor_name: string; location?: string; town?: string } | null;
  focused_product: { product_name: string } | null;
}

const JFW_CRITERIA = [
  { key: "communication", label: "Communication Skills", desc: "Clarity and confidence with HCPs" },
  { key: "product_knowledge", label: "Product Knowledge", desc: "Accurate detailing of product benefits" },
  { key: "hcp_engagement", label: "HCP Engagement", desc: "Quality of doctor interaction and follow-up" },
  { key: "sample_management", label: "Sample Management", desc: "Correct tracking and handover process" },
  { key: "professionalism", label: "Professionalism", desc: "Punctuality, appearance, and conduct" },
];

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="w-6 h-6 flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
        style={{ transition: "opacity 0.1s" }}
      >
        <LuStar className={`w-5 h-5 ${star <= value ? "fill-violet-500 text-violet-500" : "text-gray-300"}`} />
      </button>
    ))}
    <span className="ml-1.5 text-xs text-gray-500 font-semibold w-4 text-center">{value > 0 ? value : "—"}</span>
  </div>
);

const JfwScoreForm = ({ reportId, onSaved }: { reportId: string; onSaved: () => void }) => {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(JFW_CRITERIA.map((c) => [c.key, 0]))
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const overall = (() => {
    const vals = Object.values(scores).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  })();

  const canSubmit = Object.values(scores).every((v) => v > 0);

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      await submitJfwScoreApi(reportId, { criteria: scores, notes, overall_score: overall });
      setSaved(true);
      onSaved();
    } catch {
      setError("Failed to save score. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#dcfce7] rounded-xl px-4 py-3 mt-2">
        <LuCheck className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
        <p className="text-sm text-[#16a34a] font-poppins-semibold">JFW score saved — overall {overall}/5</p>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-violet-50/60 border border-violet-100 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <LuStar className="w-4 h-4 text-violet-500"/>
        <h3 className="font-poppins-bold text-[#1a1a1a] text-sm">Coaching Score</h3>
        {overall > 0 && (
          <span className="ml-auto text-xs font-poppins-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            Overall {overall}/5
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {JFW_CRITERIA.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 bg-white rounded-xl px-3.5 py-2.5 border border-violet-100"
          >
            <div className="min-w-0">
              <p className="text-sm font-poppins-semibold text-[#1a1a1a]">{label}</p>
              <p className="text-xs font-poppins text-gray-400">{desc}</p>
            </div>
            <StarRating value={scores[key]} onChange={(v) => setScores((p) => ({ ...p, [key]: v }))} />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Coaching Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What went well? What should the rep focus on before the next JFW?"
          rows={3}
          className="w-full text-sm border border-violet-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 resize-none bg-white"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
          style={{ transition: "background-color 0.15s, opacity 0.15s" }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <LuCheck className="w-4 h-4" />
          )}
          Save Score
        </button>
        {!canSubmit && (
          <p className="text-xs text-gray-400">Score all 5 criteria to save</p>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INITIALS = (r: JfwReport) =>
  `${r.user.firstname?.[0] ?? ""}${r.user.lastname?.[0] ?? ""}`.toUpperCase();
const FMT = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const VTYPE: Record<string, string> = {
  PLANNED: "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]",
  UNPLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  NCA: "bg-amber-50 text-amber-700 border-amber-200",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Jfw = () => {
  const [reports, setReports] = useState<JfwReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showScore, setShowScore] = useState<Record<string, boolean>>({});
  const [scoredIds, setScoredIds] = useState<Set<string>>(new Set());
  const [acts, setActs] = useState<Record<string, Activity[]>>({});
  const [loadingAct, setLoadingAct] = useState<string | null>(null);

  useEffect(() => {
    getJfwReportsApi()
      .then((r) => setReports(r.data?.data ?? []))
      .catch(() => setError("Failed to load JFW records."))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (acts[id]) return;
    setLoadingAct(id);
    try {
      const r = await getDailyReportActivitiesApi(id);
      setActs((p) => ({ ...p, [id]: r.data?.data ?? [] }));
    } catch {
      setActs((p) => ({ ...p, [id]: [] }));
    } finally {
      setLoadingAct(null);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-poppins-extrabold text-[#1a1a1a] text-xl tracking-tight">Joint Field Work</h1>
        <p className="text-gray-400 font-poppins text-sm mt-0.5">Days you joined a rep in the field — review visits and score the coaching session</p>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
        <LuUsers className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-poppins text-violet-700 leading-relaxed">
          When a rep tags you as JFW observer in their daily report, it appears here. Expand to review
          all HCPs visited, then score the session across 5 coaching criteria.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-gray-400 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <LuCalendarDays className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-500 font-poppins-semibold text-sm">No JFW visits yet</p>
            <p className="text-gray-400 font-poppins text-xs mt-1 text-center max-w-xs">
              Reps can tag you as their JFW observer when submitting their daily report
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((rep) => {
              const isOpen = expanded === rep.id;
              const repActs = acts[rep.id] ?? [];
              const isScored = scoredIds.has(rep.id);
              return (
                <div key={rep.id}>
                  <div
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer"
                    onClick={() => toggleExpand(rep.id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-600 font-poppins text-xs">{INITIALS(rep)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins-semibold text-[#1a1a1a] text-sm leading-tight">
                        {rep.user.firstname} {rep.user.lastname}
                      </p>
                      <p className="text-xs font-poppins text-gray-400 mt-0.5">{FMT(rep.report_date)}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <span><strong className="text-[#1a1a1a] font-poppins">{rep.visits_count}</strong> visits</span>
                      <span><strong className="text-[#1a1a1a] font-poppins">{rep.samples_count}</strong> samples</span>
                    </div>
                    {isScored ? (
                      <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] flex-shrink-0 flex items-center gap-0.5">
                        <LuCheck className="w-2.5 h-2.5" /> Scored
                      </span>
                    ) : (
                      <span className="text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">
                        JFW
                      </span>
                    )}
                    <div className="text-gray-400 flex-shrink-0">
                      {isOpen ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/60 border-t border-gray-100 px-4 sm:px-5 py-4 flex flex-col gap-3">
                      {rep.summary && (
                        <p className="text-sm text-gray-600 italic bg-white font-poppins rounded-xl px-3.5 py-2.5 border border-gray-100">
                          "{rep.summary}"
                        </p>
                      )}

                      {loadingAct === rep.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
                          Loading visits…
                        </div>
                      ) : repActs.length === 0 ? (
                        <p className="text-xs text-gray-400 font-poppins py-1">No visit activities found.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[11px] font-poppins-bold text-gray-400 uppercase tracking-widest">
                            {repActs.length} Visit{repActs.length !== 1 ? "s" : ""}
                          </p>
                          {repActs.map((act) => (
                            <div key={act.id} className="bg-white rounded-xl border border-gray-100 px-3.5 py-2.5 flex items-start gap-3">
                              <TbActivityHeartbeat
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                  act.visit_type === "NCA"
                                    ? "text-amber-500"
                                    : act.visit_type === "UNPLANNED"
                                    ? "text-sky-500"
                                    : "text-[#16a34a]"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-poppins-semibold text-[#1a1a1a]">
                                    {act.doctor?.doctor_name ?? "Unknown HCP"}
                                  </p>
                                  <span className={`text-[10px] font-poppins-bold px-1.5 py-0.5 rounded-full border ${VTYPE[act.visit_type] ?? ""}`}>
                                    {act.visit_type}
                                  </span>
                                </div>
                                {act.doctor && (
                                  <p className="text-xs font-poppins text-gray-400 mt-0.5">
                                    {[act.doctor.location, act.doctor.town].filter(Boolean).join(" - ") || "-"}
                                  </p>
                                )}
                                {act.visit_type === "NCA" && act.nca_reason && (
                                  <p className="text-xs font-poppins text-amber-700 mt-0.5">Reason: {act.nca_reason}</p>
                                )}
                                {act.focused_product && (
                                  <p className="text-xs font-poppins text-[#16a34a] mt-0.5">
                                    {act.focused_product.product_name}
                                    {act.samples_given > 0 ? ` — ${act.samples_given} samples` : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Score button / form */}
                      {!isScored && !showScore[rep.id] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowScore((p) => ({ ...p, [rep.id]: true })); }}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-poppins-bold rounded-xl border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
                          style={{ transition: "background-color 0.15s" }}
                        >
                          <LuStar className="w-3.5 h-3.5" />
                          Score this JFW session
                        </button>
                      )}

                      {showScore[rep.id] && !isScored && (
                        <JfwScoreForm
                          reportId={rep.id}
                          onSaved={() => {
                            setScoredIds((p) => new Set([...p, rep.id]));
                            setShowScore((p) => ({ ...p, [rep.id]: false }));
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jfw;
