import { useEffect, useState } from "react";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { IoMegaphoneOutline } from "react-icons/io5";
import { LuPlus, LuX, LuPencil, LuCheck, LuBan, LuBoxes } from "react-icons/lu";
import { FaArrowTrendUp } from "react-icons/fa6";
import {
  getCampaignsApi,
  createCampaignApi,
  updateCampaignApi,
  deleteCampaignApi,
  getCompanyProductsApi,
} from "../../../services/api";

interface Product { id: string; product_name: string }
interface Campaign {
  id: string; name: string; brief: string;
  start_date: string; end_date: string; status: string;
  target_all: boolean; team_ids: string[];
  product?: { id: string; product_name: string } | null;
  creator: { id: string; firstname: string; lastname: string; role: string };
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE:    { label: "Active",    color: "text-[#16a34a]", bg: "bg-[#f0fdf4]", border: "border-[#bbf7d0]" },
  DRAFT:     { label: "Draft",     color: "text-gray-500",  bg: "bg-gray-50",   border: "border-gray-200"  },
  COMPLETED: { label: "Completed", color: "text-sky-600",   bg: "bg-sky-50",    border: "border-sky-100"   },
  CANCELLED: { label: "Cancelled", color: "text-red-500",   bg: "bg-red-50",    border: "border-red-100"   },
};

const statusOfDates = (start: string, end: string, status: string): string => {
  if (status === "CANCELLED" || status === "DRAFT") return status;
  const now = new Date();
  if (isBefore(now, new Date(start))) return "DRAFT";
  if (isAfter(now, new Date(end))) return "COMPLETED";
  return "ACTIVE";
};

const TABS = ["All", "Active", "Draft", "Completed", "Cancelled"] as const;
type Tab = typeof TABS[number];

const BLANK = {
  name: "", brief: "", product_id: "",
  start_date: format(new Date(), "yyyy-MM-dd"),
  end_date:   format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
  status: "ACTIVE", target_all: true,
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<Tab>("All");
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ ...BLANK });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([getCampaignsApi(), getCompanyProductsApi()]).then(([cRes, pRes]) => {
      if (cRes.status === "fulfilled") setCampaigns(cRes.value.data?.data ?? []);
      if (pRes.status === "fulfilled") setProducts(pRes.value.data?.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = campaigns.filter((c) => {
    if (tab === "All") return true;
    const derived = statusOfDates(c.start_date, c.end_date, c.status).toUpperCase();
    return derived === tab.toUpperCase();
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ ...BLANK });
    setError("");
    setShowForm(true);
  };

  const openEdit = (c: Campaign) => {
    setEditId(c.id);
    setForm({
      name: c.name, brief: c.brief,
      product_id: c.product?.id ?? "",
      start_date: format(new Date(c.start_date), "yyyy-MM-dd"),
      end_date:   format(new Date(c.end_date),   "yyyy-MM-dd"),
      status: c.status, target_all: c.target_all,
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brief.trim()) {
      setError("Name and brief are required"); return;
    }
    setSaving(true); setError("");
    try {
      const payload = {
        name:       form.name.trim(),
        brief:      form.brief.trim(),
        product_id: form.product_id || undefined,
        start_date: new Date(form.start_date).toISOString(),
        end_date:   new Date(form.end_date).toISOString(),
        status:     form.status,
        target_all: form.target_all,
      };
      if (editId) {
        await updateCampaignApi(editId, payload);
      } else {
        await createCampaignApi(payload);
      }
      load();
      setShowForm(false);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Failed to save campaign");
    } finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this campaign?")) return;
    await deleteCampaignApi(id);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateCampaignApi(id, { status });
    load();
  };

  // Counts for tab badges
  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === "All" ? campaigns.length
      : campaigns.filter((c) => statusOfDates(c.start_date, c.end_date, c.status).toUpperCase() === t.toUpperCase()).length;
    return acc;
  }, {});

  // Active campaign KPIs
  const activeCampaigns = campaigns.filter((c) =>
    statusOfDates(c.start_date, c.end_date, c.status) === "ACTIVE"
  );
  const draftCampaigns  = campaigns.filter((c) => c.status === "DRAFT");
  const completedCount  = campaigns.filter((c) =>
    statusOfDates(c.start_date, c.end_date, c.status) === "COMPLETED"
  ).length;

  return (
    <div className="w-full p-4 sm:p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-poppins-extrabold text-[#1a1a1a] text-2xl tracking-tight">Campaigns</h1>
          <p className="text-gray-400 font-poppins text-sm mt-0.5">
            Marketing campaigns across all field teams
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] flex-shrink-0"
          style={{ transition: "background-color 0.15s" }}>
          <LuPlus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active",    value: activeCampaigns.length,  color: "text-[#16a34a]", bg: "bg-[#f0fdf4]", border: "border-[#dcfce7]" },
          { label: "Draft",     value: draftCampaigns.length,   color: "text-gray-500",  bg: "bg-gray-50",   border: "border-gray-200"  },
          { label: "Completed", value: completedCount,           color: "text-sky-600",   bg: "bg-sky-50",    border: "border-sky-100"   },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col items-center`}>
            <p className={`font-poppins-extrabold text-3xl ${s.color}`}>{loading ? "—" : s.value}</p>
            <p className={`text-xs font-poppins-semibold ${s.color} mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-poppins-semibold whitespace-nowrap flex-shrink-0 focus-visible:outline-none
              ${tab === t ? "bg-white text-[#16a34a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ transition: "background-color 0.15s" }}>
            {t}
            {counts[t] > 0 && (
              <span className={`text-[10px] px-1 rounded-full ${tab === t ? "bg-[#dcfce7] text-[#16a34a]" : "bg-gray-200 text-gray-500"}`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          [1,2,3].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-center">
            <IoMegaphoneOutline className="w-10 h-10 text-gray-200 mb-3" />
            <p className="font-poppins-semibold text-gray-400">No {tab === "All" ? "" : tab.toLowerCase()} campaigns</p>
            {tab === "All" && (
              <p className="text-sm font-poppins text-gray-300 mt-1">Create your first campaign with the button above</p>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const derived = statusOfDates(c.start_date, c.end_date, c.status);
            const meta = STATUS_META[derived] ?? STATUS_META.DRAFT;
            const daysLeft = derived === "ACTIVE"
              ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Color accent strip */}
                <div className={`h-1 w-full ${derived === "ACTIVE" ? "bg-[#16a34a]" : derived === "DRAFT" ? "bg-gray-300" : derived === "COMPLETED" ? "bg-sky-400" : "bg-red-300"}`} />

                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0`}>
                      <IoMegaphoneOutline className={`w-5 h-5 ${meta.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-poppins-bold text-[#1a1a1a] text-base">{c.name}</h3>
                            <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                          {c.product && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <LuBoxes className="w-3 h-3 text-violet-500" />
                              <span className="text-xs font-poppins-semibold text-violet-600">{c.product.product_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {derived === "DRAFT" && (
                            <button onClick={() => handleStatusChange(c.id, "ACTIVE")}
                              className="flex items-center gap-1 text-[11px] font-poppins-semibold px-2.5 py-1.5 rounded-lg bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#bbf7d0]"
                              style={{ transition: "background-color 0.15s" }}>
                              <LuCheck className="w-3 h-3" /> Launch
                            </button>
                          )}
                          {derived === "ACTIVE" && (
                            <button onClick={() => handleStatusChange(c.id, "COMPLETED")}
                              className="flex items-center gap-1 text-[11px] font-poppins-semibold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100"
                              style={{ transition: "background-color 0.15s" }}>
                              <LuCheck className="w-3 h-3" /> Complete
                            </button>
                          )}
                          <button onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#16a34a] hover:bg-gray-50 border border-transparent hover:border-gray-100"
                            style={{ transition: "color 0.15s" }}>
                            <LuPencil className="w-3.5 h-3.5" />
                          </button>
                          {derived !== "CANCELLED" && (
                            <button onClick={() => handleCancel(c.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                              style={{ transition: "color 0.15s" }}>
                              <LuBan className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Brief */}
                      <p className="text-sm font-poppins text-gray-600 mt-2 leading-relaxed line-clamp-2">{c.brief}</p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs font-poppins text-gray-400">
                        <span>
                          {format(new Date(c.start_date), "d MMM yyyy")} → {format(new Date(c.end_date), "d MMM yyyy")}
                        </span>
                        {daysLeft !== null && (
                          <span className="flex items-center gap-1 text-[#16a34a] font-poppins-semibold">
                            <FaArrowTrendUp className="w-3 h-3" />
                            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                          </span>
                        )}
                        <span className="ml-auto">
                          By {c.creator.firstname} {c.creator.lastname}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                  <IoMegaphoneOutline className="w-4 h-4 text-[#16a34a]" />
                </div>
                <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">
                  {editId ? "Edit Campaign" : "New Campaign"}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg focus-visible:outline-none">
                <LuX className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
              )}

              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Campaign Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Q3 Cardiovascular Push"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
              </div>

              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Campaign Brief *</label>
                <textarea value={form.brief} onChange={(e) => setForm(p => ({ ...p, brief: e.target.value }))}
                  placeholder="What should reps communicate to doctors? Include key messages, product benefits, and any specific asks..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] resize-none" />
              </div>

              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">
                  Focus Product <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <select value={form.product_id} onChange={(e) => setForm(p => ({ ...p, product_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white">
                  <option value="">No specific product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
                </div>
                <div>
                  <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">End Date *</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white">
                  <option value="DRAFT">Draft — not yet visible to reps</option>
                  <option value="ACTIVE">Active — visible to all reps now</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <input type="checkbox" id="target_all" checked={form.target_all}
                  onChange={(e) => setForm(p => ({ ...p, target_all: e.target.checked }))}
                  className="w-4 h-4 accent-[#16a34a] flex-shrink-0" />
                <div>
                  <label htmlFor="target_all" className="text-sm font-poppins-semibold text-[#1a1a1a] cursor-pointer">
                    All teams
                  </label>
                  <p className="text-[11px] font-poppins text-gray-400">
                    When checked, campaign applies to every team in the company
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-poppins-semibold text-gray-600 hover:bg-gray-50"
                style={{ transition: "background-color 0.15s" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-poppins-bold disabled:opacity-50"
                style={{ transition: "background-color 0.15s" }}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
