import { useState } from "react";
import { FaFileLines, FaDownload, FaCircleCheck } from "react-icons/fa6";
import api from "../../../services/api";

type ReportType = "visits" | "samples" | "call_cycle" | "nca";

interface ReportConfig {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
}

const REPORTS: ReportConfig[] = [
  { type: "visits",     label: "Visit Activity Report",    description: "All doctor visits with products detailed and outcomes",   icon: "🏥", color: "text-[#16a34a]", bg: "bg-green-50" },
  { type: "samples",    label: "Sample Accountability",    description: "Sample issuance and distribution per rep and product",    icon: "💊", color: "text-sky-600",    bg: "bg-sky-50" },
  { type: "call_cycle", label: "Call Cycle Coverage",      description: "Target vs actual visits per rep for the selected period", icon: "🔄", color: "text-amber-600",  bg: "bg-amber-50" },
  { type: "nca",        label: "NCA Report",               description: "No-Customer-Activity logs with reasons and frequencies",  icon: "⚠️", color: "text-red-600",    bg: "bg-red-50" },
];

const Reports = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<ReportType | null>(null);
  const [success, setSuccess] = useState<ReportType | null>(null);

  const download = async (type: ReportType) => {
    setLoading(type);
    setSuccess(null);
    try {
      const res = await api.get(`/report/export?type=${type}&start=${startDate}&end=${endDate}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `kibagrep_${type}_${startDate}_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(type);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      alert("Report generation failed. The export endpoint may not be ready yet.");
    } finally { setLoading(null); }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Export field data as Excel reports</p>
      </div>

      {/* Date range picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-5">
        <p className="text-sm font-bold text-[#1a2530] mb-3">Report Period</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20" />
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORTS.map(r => (
          <div key={r.type} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${r.bg} rounded-xl flex items-center justify-center text-lg shrink-0`}>
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a2530]">{r.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{r.description}</p>
              </div>
            </div>
            <button
              onClick={() => download(r.type)}
              disabled={loading === r.type}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border focus-visible:outline-none disabled:opacity-50 ${
                success === r.type
                  ? "bg-green-50 border-green-200 text-[#16a34a]"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              style={{ transition: "background-color 0.15s" }}>
              {loading === r.type ? (
                <><div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /><span>Generating…</span></>
              ) : success === r.type ? (
                <><FaCircleCheck className="w-3.5 h-3.5" /><span>Downloaded</span></>
              ) : (
                <><FaDownload className="w-3.5 h-3.5" /><span>Download Excel</span></>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-[#0f2318] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <FaFileLines className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">Reports use the selected date range above</p>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">
              All reports are scoped to your company's data only. Field activity before the start date will not be included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
