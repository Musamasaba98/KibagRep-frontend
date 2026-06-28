import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getLibraryApi,
  addLiteratureItemApi,
  removeLiteratureItemApi,
  getCompanyProductsApi,
} from "../../../services/api";
import { LuBookOpen, LuFileText, LuVideo, LuImage, LuExternalLink, LuTrash2, LuPlus } from "react-icons/lu";
import { MdClose, MdOutlineFilterList } from "react-icons/md";

interface LiteratureItem {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_type?: string | null;
  file_size_kb?: number | null;
  sort_order?: number;
  product?: { id: string; product_name: string } | null;
  team?: { id: string; team_name: string } | null;
  created_at: string;
}

interface Product {
  id: string;
  product_name: string;
}

function fileIcon(type?: string | null) {
  if (!type) return LuFileText;
  const t = type.toLowerCase();
  if (t.includes("video") || t === "mp4" || t === "mov") return LuVideo;
  if (t.includes("image") || t === "png" || t === "jpg") return LuImage;
  return LuFileText;
}

function fileTypeBadge(type?: string | null) {
  if (!type) return { label: "FILE", color: "bg-gray-100 text-gray-500" };
  const t = type.toLowerCase();
  if (t === "pdf") return { label: "PDF", color: "bg-red-50 text-red-600" };
  if (t.includes("video") || t === "mp4") return { label: "VIDEO", color: "bg-purple-50 text-purple-600" };
  if (t.includes("powerpoint") || t === "pptx") return { label: "PPT", color: "bg-orange-50 text-orange-600" };
  if (t.includes("word") || t === "docx") return { label: "DOC", color: "bg-blue-50 text-blue-600" };
  return { label: t.toUpperCase().slice(0, 5), color: "bg-gray-100 text-gray-500" };
}

function fmtSize(kb?: number | null) {
  if (!kb) return null;
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const UPLOAD_ROLES = ["SUPER_ADMIN", "SALES_ADMIN", "COUNTRY_MGR", "Manager", "Supervisor"];
const DELETE_ROLES = ["SUPER_ADMIN", "SALES_ADMIN", "COUNTRY_MGR", "Manager"];

const EMPTY_FORM = {
  title: "", description: "", file_url: "",
  file_type: "pdf", file_size_kb: "", product_id: "", sort_order: "",
};

const Library = () => {
  const user = useSelector((s: any) => s.auth?.user);
  const canUpload = UPLOAD_ROLES.includes(user?.role ?? "");
  const canDelete = DELETE_ROLES.includes(user?.role ?? "");

  const [items, setItems]         = useState<LiteratureItem[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getLibraryApi()
      .then((r) => setItems(r.data?.data ?? []))
      .catch(() => setError("Failed to load library"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (canUpload) {
      getCompanyProductsApi()
        .then((r) => {
          const raw = r.data?.data ?? r.data ?? [];
          setProducts(raw.map((p: any) => p.product ?? p));
        })
        .catch(() => {});
    }
  }, [canUpload]);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.file_url.trim()) {
      setSaveError("Title and file URL are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await addLiteratureItemApi({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        file_url: form.file_url.trim(),
        file_type: form.file_type || undefined,
        file_size_kb: form.file_size_kb ? parseInt(form.file_size_kb) : undefined,
        product_id: form.product_id || undefined,
        sort_order: form.sort_order ? parseInt(form.sort_order) : undefined,
      });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch {
      setSaveError("Failed to add item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this item from the library?")) return;
    setDeleting(id);
    try {
      await removeLiteratureItemApi(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert("Failed to remove item.");
    } finally {
      setDeleting(null);
    }
  };

  const productOptions = Array.from(
    new Map(
      items
        .filter((i) => i.product)
        .map((i) => [i.product!.id, i.product!.product_name])
    ).entries()
  );

  const filtered = productFilter
    ? items.filter((i) => i.product?.id === productFilter)
    : items;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-poppins-extrabold text-[#222f36]">Product Library</h1>
          <p className="text-sm font-poppins text-gray-500 mt-0.5">
            {canUpload
              ? "Manage brochures, slides, and e-detailing materials for your team"
              : "Brochures, slides, and detailing materials from your marketing team"}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#16a34a] text-white font-poppins-semibold text-sm rounded-xl hover:bg-[#15803d] focus-visible:outline-none shadow-sm shadow-green-700/20"
          >
            <LuPlus className="w-4 h-4" />
            Add material
          </button>
        )}
      </div>

      {/* Product filter chips */}
      {!loading && productOptions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <MdOutlineFilterList className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setProductFilter("")}
            className={`text-xs font-poppins-semibold px-3 py-1.5 rounded-full focus-visible:outline-none ${!productFilter ? "bg-[#16a34a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All
          </button>
          {productOptions.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setProductFilter(id)}
              className={`text-xs font-poppins-semibold px-3 py-1.5 rounded-full focus-visible:outline-none ${productFilter === id ? "bg-[#16a34a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <LuBookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-poppins-semibold">No materials yet</p>
          <p className="text-sm font-poppins mt-1">
            {canUpload ? "Add the first brochure or slide deck" : "Your marketing team will upload materials here"}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className={canUpload ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          {filtered.map((item) => {
            const Icon = fileIcon(item.file_type);
            const badge = fileTypeBadge(item.file_type);
            const size = fmtSize(item.file_size_kb);
            return canUpload ? (
              /* Admin/manager row view */
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] p-4 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#16a34a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-poppins-bold text-[#1a1a1a] text-sm">{item.title}</p>
                    <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                    {item.team ? (
                      <span className="text-[10px] font-poppins-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                        {item.team.team_name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-poppins-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                        Company-wide
                      </span>
                    )}
                    {item.product && (
                      <span className="text-[11px] font-poppins-semibold bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 rounded-full">{item.product.product_name}</span>
                    )}
                    {size && <span className="text-[11px] font-poppins text-gray-400">{size}</span>}
                  </div>
                  {item.description && (
                    <p className="text-xs font-poppins text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-[#f0fdf4] text-gray-400 hover:text-[#16a34a] focus-visible:outline-none" title="Open">
                    <LuExternalLink className="w-4 h-4" />
                  </a>
                  {canDelete && (
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 focus-visible:outline-none disabled:opacity-40" title="Remove">
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Rep card view */
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] p-5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#16a34a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-poppins-bold text-[#1a1a1a] text-sm leading-snug">{item.title}</p>
                    <span className={`text-[10px] font-poppins-bold px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.label}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs font-poppins text-gray-400 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {item.product && (
                      <span className="text-[11px] font-poppins-semibold bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 rounded-full">{item.product.product_name}</span>
                    )}
                    {size && <span className="text-[11px] font-poppins text-gray-400">{size}</span>}
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 text-xs font-poppins-semibold text-[#16a34a] hover:text-[#15803d] focus-visible:outline-none">
                      Open <LuExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setSaveError(""); } }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-xl w-[460px] max-w-[94vw] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Add material to library</h2>
              <button onClick={() => { setShowAdd(false); setSaveError(""); setForm(EMPTY_FORM); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none">
                <MdClose className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 p-5">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-poppins px-3 py-2 rounded-xl">{saveError}</div>
              )}
              <div>
                <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">
                  Title <span className="text-red-400">*</span>
                </label>
                <input type="text" placeholder="e.g. Amlodipine 5mg Patient Brochure"
                  value={form.title} onChange={(e) => setField("title", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]" />
              </div>
              <div>
                <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Description (optional)</label>
                <textarea placeholder="Brief description of what this material covers…"
                  value={form.description} onChange={(e) => setField("description", e.target.value)}
                  rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">
                  File URL <span className="text-red-400">*</span>
                </label>
                <input type="url" placeholder="https://drive.google.com/file/…"
                  value={form.file_url} onChange={(e) => setField("file_url", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]" />
                <p className="text-[11px] font-poppins text-gray-400 mt-1">Paste a shareable link (Google Drive, Dropbox, OneDrive, etc.)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">File type</label>
                  <select value={form.file_type} onChange={(e) => setField("file_type", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] bg-white">
                    <option value="pdf">PDF</option>
                    <option value="pptx">PowerPoint</option>
                    <option value="docx">Word</option>
                    <option value="mp4">Video (MP4)</option>
                    <option value="jpg">Image</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Size (KB, optional)</label>
                  <input type="number" placeholder="e.g. 2048"
                    value={form.file_size_kb} onChange={(e) => setField("file_size_kb", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Product (optional)</label>
                  <select value={form.product_id} onChange={(e) => setField("product_id", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] bg-white">
                    <option value="">No product tag</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-poppins-semibold text-gray-500 mb-1 block">Sort order (optional)</label>
                  <input type="number" placeholder="1"
                    value={form.sort_order} onChange={(e) => setField("sort_order", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-[#16a34a] text-white font-poppins-semibold text-sm rounded-xl hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none mt-1">
                {saving ? "Adding…" : "Add to library"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
