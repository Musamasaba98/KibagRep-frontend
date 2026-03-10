import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getActivityHistoryApi } from "../../../services/api";
import { FaUserDoctor } from "react-icons/fa6";
import { MdOutlineMedication } from "react-icons/md";

interface Visit {
  id: string;
  date: string;
  samples_given: number;
  doctor: { id: string; doctor_name: string; town: string; location: string };
  focused_product: { id: string; product_name: string } | null;
  products_detailed: { id: string; product_name: string }[];
}

interface Meta {
  total: number;
  page: number;
  pages: number;
}

const Visits = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError("");
    getActivityHistoryApi({ days: 30, page, limit: 20 })
      .then((res) => {
        setVisits(res.data.data ?? []);
        setMeta(res.data.meta ?? { total: 0, page: 1, pages: 1 });
      })
      .catch(() => setError("Failed to load visit history"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#222f36]">Visit History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last 30 days — {meta.total} visits</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && visits.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <FaUserDoctor className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-semibold">No visits logged in the last 30 days</p>
          <p className="text-sm mt-1">Use the "Log Visit" button to record your first visit</p>
        </div>
      )}

      {!loading && !error && visits.length > 0 && (
        <div className="flex flex-col gap-3">
          {visits.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl shadow shadow-gray-100/80 hover:shadow-md hover:shadow-gray-200/60 px-5 py-4 flex items-start gap-4 cursor-pointer transition-shadow"
            >
              <div className="min-w-[56px] flex flex-col items-center bg-green-50 rounded-lg py-2 px-1">
                <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">
                  {format(new Date(v.date), "MMM")}
                </span>
                <span className="text-2xl font-black text-[#16a34a] leading-none">
                  {format(new Date(v.date), "dd")}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  {format(new Date(v.date), "EEE")}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#222f36] text-sm">{v.doctor.doctor_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.doctor.location} · {v.doctor.town}
                    </p>
                  </div>
                  {v.samples_given > 0 && (
                    <span className="flex-shrink-0 flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <MdOutlineMedication className="w-3.5 h-3.5" />
                      {v.samples_given} samples
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {v.focused_product && (
                    <span className="bg-[#16a34a] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      ★ {v.focused_product.product_name}
                    </span>
                  )}
                  {v.products_detailed?.map((p) => (
                    <span
                      key={p.id}
                      className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full"
                    >
                      {p.product_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">{page} / {meta.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            disabled={page === meta.pages}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Visits;
