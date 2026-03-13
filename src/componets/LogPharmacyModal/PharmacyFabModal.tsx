/**
 * PharmacyFabModal — launched from the FAB when no pharmacy is pre-selected.
 * Shows a search-first screen, then opens LogPharmacyModal for the chosen pharmacy.
 */
import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { TbPill } from "react-icons/tb";
import { searchPharmaciesApi } from "../../services/api";
import LogPharmacyModal from "./LogPharmacyModal";

interface Pharmacy { id: string; pharmacy_name: string; location?: string; town?: string; }

interface Props { onClose: () => void; onSuccess: () => void; }

const PharmacyFabModal = ({ onClose, onSuccess }: Props) => {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Pharmacy[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      searchPharmaciesApi(query)
        .then((r) => setResults(r.data.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Once pharmacy is selected, hand off to LogPharmacyModal
  if (selected) {
    return (
      <LogPharmacyModal
        pharmacyId={selected.id}
        pharmacyName={selected.pharmacy_name}
        pharmacyLocation={[selected.location, selected.town].filter(Boolean).join(" · ")}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-violet-600 px-5 py-4">
          <div className="flex items-center gap-2">
            <TbPill className="w-5 h-5 text-white/80" />
            <h2 className="text-white font-bold text-lg">Log Pharmacy Visit</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white focus-visible:outline-none rounded">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700">Which pharmacy?</label>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />

          {searching && (
            <p className="text-xs text-gray-400 text-center py-2">Searching…</p>
          )}

          {!searching && results.length > 0 && (
            <ul className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {results.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-3 hover:bg-violet-50 cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <p className="text-sm font-semibold text-[#222f36]">{p.pharmacy_name}</p>
                  {(p.location || p.town) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[p.location, p.town].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!searching && query.length >= 2 && results.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No pharmacies found</p>
          )}

          {query.length < 2 && (
            <p className="text-xs text-gray-400">Type at least 2 characters to search</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyFabModal;
