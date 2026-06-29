import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { LuUser } from "react-icons/lu";
import { getCompanyUsersApi, downloadReportApi } from "../../services/api";

interface CompanyUser {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
}

interface Props {
  /** Roles to include in the rep picker. Defaults to MedicalRep only. */
  roles?: string[];
  /** If true, pre-select the given userId and hide the picker (e.g. supervisor downloading a specific rep). */
  preselectedUserId?: string;
  preselectedName?: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const thisMonth = new Date().getMonth() + 1;
const thisYear  = new Date().getFullYear();
const YEARS = [thisYear, thisYear - 1, thisYear - 2];

export const DownloadReportWidget = ({ roles = ["MedicalRep"], preselectedUserId, preselectedName }: Props) => {
  const [users,       setUsers]       = useState<CompanyUser[]>([]);
  const [userId,      setUserId]      = useState(preselectedUserId ?? "");
  const [month,       setMonth]       = useState(thisMonth);
  const [year,        setYear]        = useState(thisYear);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (preselectedUserId) return; // no need to load picker
    getCompanyUsersApi()
      .then((r) => {
        const all: CompanyUser[] = r.data?.data ?? [];
        setUsers(all.filter((u) => roles.includes(u.role)));
      })
      .catch(() => {});
  }, [preselectedUserId, roles.join(",")]);

  const handleDownload = async () => {
    if (!userId) { setError("Please select a rep first"); return; }
    setError("");
    setDownloading(true);
    try {
      const res = await downloadReportApi(month, year, userId);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const name = preselectedName
        ?? users.find((u) => u.id === userId)?.firstname + " " + users.find((u) => u.id === userId)?.lastname
        ?? "Rep";
      a.href     = url;
      a.download = `${name.replace(/\s+/g, "_")}_${MONTHS[month - 1]}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0">
          <FiDownload className="w-4 h-4 text-[#16a34a]" />
        </div>
        <div>
          <h3 className="font-poppins-bold text-[#1a1a1a] text-[15px]">Download Rep Report</h3>
          <p className="text-xs font-poppins text-gray-400">Excel — all HCP visits, pharmacy coverage & samples for the month</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">

        {/* Rep picker — hidden when preselected */}
        {!preselectedUserId && (
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">
              <LuUser className="inline w-3 h-3 mr-1" />Rep
            </label>
            <select
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setError(""); }}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white"
            >
              <option value="">Select rep…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstname} {u.lastname}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Month */}
        <div className="w-36 flex-shrink-0">
          <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="w-24 flex-shrink-0">
          <label className="block text-xs font-poppins-semibold text-gray-500 mb-1.5">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-poppins outline-none focus:border-[#16a34a] bg-white"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading || (!preselectedUserId && !userId)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-sm font-poppins-bold rounded-xl flex-shrink-0 focus-visible:outline-none"
          style={{ transition: "background-color 0.15s" }}
        >
          <FiDownload className="w-4 h-4" />
          {downloading ? "Generating…" : "Download Excel"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 font-poppins bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
};

export default DownloadReportWidget;
