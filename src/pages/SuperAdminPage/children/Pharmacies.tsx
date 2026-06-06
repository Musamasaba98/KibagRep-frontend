import { useState, useEffect, useCallback, useRef } from "react";
import { FaHospital, FaMagnifyingGlass, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import api from "../../../services/api";

interface Pharmacy {
  id: string;
  pharmacy_name: string;
  location?: string;
  town?: string;
  district?: string;
  region?: string;
  pharmacy_type?: string;
  contact?: string;
}

const TYPE_LABELS: Record<string, string> = {
  INDEPENDENT:       "Independent",
  CHAIN:             "Chain",
  HOSPITAL_INTERNAL: "Hospital",
  DISPENSING_CLINIC: "Dispensing Clinic",
  COMMUNITY_HEALTH:  "Community Health",
};
const TYPE_COLOURS: Record<string, string> = {
  INDEPENDENT:       "bg-gray-50 text-gray-600 border-gray-200",
  CHAIN:             "bg-blue-50 text-blue-700 border-blue-200",
  HOSPITAL_INTERNAL: "bg-amber-50 text-amber-700 border-amber-200",
  DISPENSING_CLINIC: "bg-sky-50 text-sky-700 border-sky-200",
  COMMUNITY_HEALTH:  "bg-green-50 text-green-700 border-green-200",
};
const TYPES = Object.keys(TYPE_LABELS);
const LIMIT = 50;

const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback((pg: number, q: string, type: string) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: pg, limit: LIMIT };
    if (q)    params.search = q;
    if (type) params.type   = type;
    api.get("/pharmacy", { params })
      .then(r => {
        setPharmacies(r.data.data ?? []);
        setTotal(r.data.total ?? 0);
        setPages(r.data.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search, typeFilter); }, [page, typeFilter]);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, v, typeFilter); }, 400);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Licensed Pharmacies</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {loading ? "Loading…" : `${total.toLocaleString()} pharmacies · NDA licensed outlets`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, district, or region…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#16a34a] cursor-pointer">
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-gray-200 border-t-[#16a34a] rounded-full animate-spin" /></div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <FaHospital className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-semibold">No matching pharmacies</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid px-5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: "1fr 12rem 14rem 10rem" }}>
              <span>Pharmacy</span><span>Type</span><span>Location</span><span>District</span>
            </div>
            <div className="divide-y divide-gray-50">
              {pharmacies.map(p => (
                <div key={p.id} className="flex sm:grid items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/60"
                  style={{ gridTemplateColumns: "1fr 12rem 14rem 10rem" }}>
                  {/* Mobile */}
                  <div className="flex items-start gap-2.5 sm:hidden">
                    <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <FaHospital className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a2530] leading-snug">{p.pharmacy_name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {[p.district, p.region].filter(Boolean).join(" · ")}
                      </p>
                      {p.pharmacy_type && (
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_COLOURS[p.pharmacy_type] ?? TYPE_COLOURS.INDEPENDENT}`}>
                          {TYPE_LABELS[p.pharmacy_type] ?? p.pharmacy_type}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Desktop */}
                  <p className="hidden sm:block text-sm font-semibold text-[#1a2530] truncate">{p.pharmacy_name}</p>
                  {p.pharmacy_type ? (
                    <span className={`hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit whitespace-nowrap ${TYPE_COLOURS[p.pharmacy_type] ?? TYPE_COLOURS.INDEPENDENT}`}>
                      {TYPE_LABELS[p.pharmacy_type] ?? p.pharmacy_type}
                    </span>
                  ) : <span className="hidden sm:block" />}
                  <p className="hidden sm:block text-xs text-gray-500 truncate">{p.location ?? "—"}</p>
                  <p className="hidden sm:block text-xs text-gray-500 truncate">{p.district ?? "—"}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} total</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <FaChevronLeft className="w-3 h-3" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, pages - 4));
              const pg = start + i;
              if (pg > pages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border ${
                    pg === page ? "bg-[#16a34a] text-white border-[#16a34a]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>{pg}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacies;
