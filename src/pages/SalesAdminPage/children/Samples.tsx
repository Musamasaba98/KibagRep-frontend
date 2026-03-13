import { useState, useEffect } from "react";
import { FaPills, FaPlus, FaXmark } from "react-icons/fa6";
import { MdOutlineMedication } from "react-icons/md";
import { getCompanyProductsApi, getCompanyUsersApi, issueSamplesAdminApi, getTeamSampleBalancesFullApi } from "../../../services/api";

interface Product { id: string; product_name: string; }
interface User { id: string; firstname: string; lastname: string; role: string; }
interface Balance { id: string; issued: number; given: number; product: { product_name: string }; user: { firstname: string; lastname: string }; }

const Samples = () => {
  const [products, setProducts]   = useState<Product[]>([]);
  const [reps, setReps]           = useState<User[]>([]);
  const [balances, setBalances]   = useState<Balance[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ user_id: "", product_id: "", quantity: "10" });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      getCompanyProductsApi(),
      getCompanyUsersApi(),
      getTeamSampleBalancesFullApi(),
    ])
      .then(([pr, ur, br]) => {
        setProducts(pr.data.data ?? []);
        setReps((ur.data.data ?? []).filter((u: User) => ["MedicalRep","Supervisor"].includes(u.role)));
        setBalances(br.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    const qty = parseInt(form.quantity);
    if (!form.user_id || !form.product_id || !qty || qty < 1) { setFormError("All fields required"); return; }
    setSaving(true);
    try {
      await issueSamplesAdminApi({ user_id: form.user_id, product_id: form.product_id, quantity: qty });
      setShowModal(false); setForm({ user_id: "", product_id: "", quantity: "10" }); load();
    } catch (err: any) { setFormError(err.response?.data?.message || "Failed to issue samples"); }
    finally { setSaving(false); }
  };

  // Group balances by rep
  const byRep: Record<string, { name: string; items: Balance[] }> = {};
  for (const b of balances) {
    const name = `${b.user.firstname} ${b.user.lastname}`;
    if (!byRep[name]) byRep[name] = { name, items: [] };
    byRep[name].items.push(b);
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Sample Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Issue samples to reps and track balances</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Issue Samples</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
        </div>
      ) : Object.keys(byRep).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center py-20 text-gray-400">
          <FaPills className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold">No sample balances yet</p>
          <p className="text-sm mt-1">Issue samples to reps to start tracking</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.values(byRep).map(rep => (
            <div key={rep.name} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/40">
                <p className="text-sm font-bold text-[#1a2530]">{rep.name}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {rep.items.map(b => {
                  const remaining = b.issued - b.given;
                  const pct = b.issued > 0 ? Math.round((remaining / b.issued) * 100) : 0;
                  return (
                    <div key={b.id} className="flex items-center gap-4 px-5 py-3">
                      <MdOutlineMedication className="w-4 h-4 text-[#16a34a] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a2530] truncate">{b.product.product_name}</p>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[160px]">
                          <div className="h-full bg-[#16a34a] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-[#1a2530]">{remaining}</p>
                        <p className="text-[10px] text-gray-400">{b.given} of {b.issued} given</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-[#1a2530] text-lg tracking-tight">Issue Samples</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleIssue} className="px-6 py-5 flex flex-col gap-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{formError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rep</label>
                <select required value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                  <option value="">Select rep…</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.firstname} {r.lastname}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Product</label>
                <select required value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Quantity</label>
                <input type="number" required min={1} value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Issuing…" : "Issue Samples"}
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
