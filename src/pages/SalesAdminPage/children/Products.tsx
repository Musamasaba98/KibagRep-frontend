import { useState, useEffect } from "react";
import { FaBoxOpen, FaPlus, FaXmark, FaTrash, FaPencil } from "react-icons/fa6";
import { getCompanyProductsApi, createCompanyProductApi, deleteProductApi, updateProductNameApi } from "../../../services/api";

type Classification = "CASH_COW" | "NEW_LAUNCH" | "GROWTH" | "DECLINING";

interface Product {
  id: string;
  product_name: string;
  classification: Classification;
  generic_name?: string | null;
}

const CLASS_LABEL: Record<Classification, string> = {
  CASH_COW: "Cash Cow", NEW_LAUNCH: "New Launch", GROWTH: "Growth", DECLINING: "Declining",
};
const CLASS_COLOR: Record<Classification, string> = {
  CASH_COW:   "bg-green-100 text-[#16a34a]",
  NEW_LAUNCH: "bg-sky-100 text-sky-700",
  GROWTH:     "bg-teal-100 text-teal-700",
  DECLINING:  "bg-red-100 text-red-600",
};

const CLASSIFICATIONS: Classification[] = ["CASH_COW", "NEW_LAUNCH", "GROWTH", "DECLINING"];

const Products = () => {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm]           = useState({ product_name: "", classification: "GROWTH" as Classification, generic_name: "" });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    getCompanyProductsApi()
      .then(r => setProducts(r.data.data ?? []))
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ product_name: "", classification: "GROWTH", generic_name: "" }); setFormError(""); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ product_name: p.product_name, classification: p.classification, generic_name: p.generic_name ?? "" }); setFormError(""); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    if (!form.product_name.trim()) { setFormError("Product name is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateProductNameApi(editing.id, { product_name: form.product_name.trim(), classification: form.classification, generic_name: form.generic_name || undefined });
      } else {
        await createCompanyProductApi({ product_name: form.product_name.trim(), classification: form.classification, generic_name: form.generic_name || undefined });
      }
      setShowModal(false); load();
    } catch (err: any) { setFormError(err.response?.data?.error || err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await deleteProductApi(id); load(); }
    catch { alert("Failed to delete product"); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products in your company portfolio</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_0_rgba(22,163,74,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ transition: "background-color 0.15s" }}>
          <FaPlus className="w-3.5 h-3.5" /><span>Add Product</span>
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaBoxOpen className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No products yet</p>
            <p className="text-sm mt-1">Add your company's products to enable detailing and sample tracking</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50">
                <div className="w-8 h-8 bg-[#16a34a]/10 rounded-xl flex items-center justify-center shrink-0">
                  <FaBoxOpen className="w-3.5 h-3.5 text-[#16a34a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2530] truncate">{p.product_name}</p>
                  {p.generic_name && <p className="text-xs text-gray-400 truncate">{p.generic_name}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${CLASS_COLOR[p.classification]}`}>
                  {CLASS_LABEL[p.classification]}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)}
                    className="p-1.5 text-gray-400 hover:text-[#16a34a] hover:bg-green-50 rounded-lg focus-visible:outline-none">
                    <FaPencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.product_name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus-visible:outline-none">
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_0_rgba(0,0,0,0.18)] w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-black text-[#1a2530] text-lg tracking-tight">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 focus-visible:outline-none">
                <FaXmark className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{formError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Brand Name *</label>
                <input type="text" required value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g. Amoxil 500mg"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Generic Name <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="text" value={form.generic_name}
                  onChange={e => setForm(f => ({ ...f, generic_name: e.target.value }))}
                  placeholder="e.g. Amoxicillin"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Classification</label>
                <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value as Classification }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 bg-white">
                  {CLASSIFICATIONS.map(c => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                  style={{ transition: "background-color 0.15s" }}>
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
