import { useEffect, useState } from "react";
import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { MdOutlinePendingActions } from "react-icons/md";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import { TbPackage } from "react-icons/tb";
import {
  getProductPricesApi,
  updateProductPriceApi,
  approveProductPriceApi,
  rejectProductPriceApi,
} from "../../../services/api";

interface ProductPrice {
  id: string;
  product_name: string;
  unit_price: number;
  pending_unit_price: number | null;
  price_proposed_by: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    getProductPricesApi()
      .then(res => setProducts(res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (p: ProductPrice) => {
    setDraftPrice(p.unit_price);
    setEditingId(p.id);
  };

  const savePrice = async (id: string) => {
    setSavingId(id);
    await updateProductPriceApi(id, draftPrice);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, unit_price: draftPrice, pending_unit_price: null, price_proposed_by: null } : p));
    setSavingId(null);
    setEditingId(null);
  };

  const approve = async (id: string) => {
    setSavingId(id);
    await approveProductPriceApi(id);
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, unit_price: p.pending_unit_price ?? p.unit_price, pending_unit_price: null, price_proposed_by: null };
    }));
    setSavingId(null);
  };

  const reject = async (id: string) => {
    setSavingId(id);
    await rejectProductPriceApi(id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, pending_unit_price: null, price_proposed_by: null } : p));
    setSavingId(null);
  };

  const pendingCount = products.filter(p => p.pending_unit_price != null).length;

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-black text-[#1a1a1a] text-2xl tracking-tight">Product Prices</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Set and approve product unit prices. Managers propose — you approve.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700">
            <MdOutlinePendingActions className="w-3.5 h-3.5" />
            {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
          <span className="text-sm text-gray-400">Loading products…</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
            <TbPackage className="w-6 h-6 text-[#16a34a]" />
          </div>
          <p className="font-semibold text-gray-700">No products configured</p>
          <p className="text-sm text-gray-400">Products are added by Sales Admin from the product master list.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 bg-gray-50/70 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Active price</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Pending proposal</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Actions</span>
          </div>

          {products.map(p => {
            const isEditing = editingId === p.id;
            const isSaving = savingId === p.id;
            const hasPending = p.pending_unit_price != null;

            return (
              <div
                key={p.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 ${hasPending ? "bg-amber-50/30" : ""}`}
                style={{ transition: "background-color 0.15s" }}
              >
                {/* Product name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                  <span className="text-sm font-medium text-[#1a1a1a] truncate">{p.product_name}</span>
                </div>

                {/* Active price */}
                <div className="shrink-0 text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">UGX</span>
                      <input
                        type="number" min={0} value={draftPrice}
                        onChange={e => setDraftPrice(Number(e.target.value))}
                        className="w-32 text-right text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#dcfce7]"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      {p.unit_price > 0 ? `UGX ${p.unit_price.toLocaleString()}` : <span className="text-gray-300 font-normal text-xs">Not set</span>}
                    </span>
                  )}
                </div>

                {/* Pending proposal */}
                <div className="shrink-0 text-right">
                  {hasPending ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      <MdOutlinePendingActions className="w-3 h-3" />
                      UGX {p.pending_unit_price!.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center justify-end gap-1.5">
                  {isEditing ? (
                    <>
                      <button onClick={() => savePrice(p.id)} disabled={isSaving}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LuCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s" }}>
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {hasPending && (
                        <>
                          <button onClick={() => approve(p.id)} disabled={isSaving}
                            title="Approve proposed price"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                            style={{ transition: "background-color 0.15s" }}>
                            {isSaving ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <IoCheckmarkCircleOutline className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button onClick={() => reject(p.id)} disabled={isSaving}
                            title="Reject proposed price"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                            style={{ transition: "background-color 0.15s" }}>
                            <IoCloseCircleOutline className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => startEdit(p)}
                        title="Set price directly"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-[#16a34a] rounded-lg border border-gray-200 hover:border-[#16a34a] hover:bg-[#f0fdf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
                        style={{ transition: "background-color 0.15s, border-color 0.15s, color 0.15s" }}>
                        <LuPencil className="w-3 h-3" />
                        Set
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
