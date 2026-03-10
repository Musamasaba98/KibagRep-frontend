import {
  FaUserDoctor,
  FaHospital,
  FaBoxOpen,
  FaBuildingColumns,
  FaFileArrowUp,
  FaFileLines,
  FaCirclePlus,
} from "react-icons/fa6";
import { RiFileExcel2Line } from "react-icons/ri";

// ── Master Data Summary ────────────────────────────────────────────────────

const summaryCards = [
  {
    label: "Doctors",
    count: "1,247",
    subtitle: "in master database",
    icon: FaUserDoctor,
    iconBg: "bg-green-100",
    iconColor: "text-[#16a34a]",
    countColor: "text-[#16a34a]",
    shadow: "shadow-[0_2px_12px_0_rgba(22,163,74,0.10)]",
  },
  {
    label: "Pharmacies",
    count: "389",
    subtitle: "registered pharmacies",
    icon: FaHospital,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    countColor: "text-teal-600",
    shadow: "shadow-[0_2px_12px_0_rgba(13,148,136,0.10)]",
  },
  {
    label: "Products",
    count: "54",
    subtitle: "active product SKUs",
    icon: FaBoxOpen,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    countColor: "text-purple-600",
    shadow: "shadow-[0_2px_12px_0_rgba(147,51,234,0.10)]",
  },
  {
    label: "Facilities",
    count: "203",
    subtitle: "health facilities",
    icon: FaBuildingColumns,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    countColor: "text-amber-600",
    shadow: "shadow-[0_2px_12px_0_rgba(217,119,6,0.10)]",
  },
];

// ── Quick Actions ──────────────────────────────────────────────────────────

const quickActions = [
  {
    icon: RiFileExcel2Line,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-green-50",
    title: "Upload Doctor List",
    desc: "Bulk import from Excel",
  },
  {
    icon: FaFileArrowUp,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50",
    title: "Upload Pharmacy List",
    desc: "Bulk import from Excel",
  },
  {
    icon: FaCirclePlus,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    title: "Add New Doctor",
    desc: "Register a single doctor",
  },
  {
    icon: FaFileLines,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    title: "Generate Report",
    desc: "Export filtered field data",
  },
];

// ── Recent Uploads ─────────────────────────────────────────────────────────

type UploadStatus = "Success" | "Failed" | "Pending";

interface UploadRow {
  file: string;
  type: string;
  records: number;
  uploadedBy: string;
  date: string;
  status: UploadStatus;
  errorNote?: string;
}

const recentUploads: UploadRow[] = [
  {
    file: "doctors_central_march.xlsx",
    type: "Doctors",
    records: 47,
    uploadedBy: "Tumusiime P.",
    date: "05 Mar 2026",
    status: "Success",
  },
  {
    file: "pharmacies_eastern.xlsx",
    type: "Pharmacies",
    records: 23,
    uploadedBy: "Ssenabulya R.",
    date: "04 Mar 2026",
    status: "Success",
  },
  {
    file: "doctors_northern.xlsx",
    type: "Doctors",
    records: 31,
    uploadedBy: "Nakato S.",
    date: "03 Mar 2026",
    status: "Failed",
    errorNote: "3 errors",
  },
  {
    file: "products_q1.xlsx",
    type: "Products",
    records: 12,
    uploadedBy: "Kayiira M.",
    date: "01 Mar 2026",
    status: "Success",
  },
  {
    file: "pharmacies_western.xlsx",
    type: "Pharmacies",
    records: 18,
    uploadedBy: "Nalwanga A.",
    date: "28 Feb 2026",
    status: "Pending",
  },
];

const statusStyles: Record<UploadStatus, string> = {
  Success: "bg-green-50 text-[#16a34a] border border-green-200",
  Failed: "bg-red-50 text-red-600 border border-red-200",
  Pending: "bg-amber-50 text-amber-600 border border-amber-200",
};

// ── Tier Distribution ──────────────────────────────────────────────────────

const tiers = [
  {
    tier: "A",
    count: 312,
    percent: 25,
    barColor: "bg-[#16a34a]",
    badgeBg: "bg-green-100",
    badgeText: "text-[#16a34a]",
  },
  {
    tier: "B",
    count: 587,
    percent: 47,
    barColor: "bg-amber-400",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  {
    tier: "C",
    count: 348,
    percent: 28,
    barColor: "bg-gray-400",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

const Dashboard = () => {
  return (
    <div className="w-full p-6 flex flex-col gap-6">

      {/* ── Section 1: Master Data Summary ── */}
      <div className="flex flex-wrap gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-xl p-5 flex items-start gap-4 flex-1 min-w-[180px] ${card.shadow}`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className={`text-3xl font-extrabold leading-tight ${card.countColor}`}>
                  {card.count}
                </p>
                <p className="text-[#212121] font-semibold text-sm mt-0.5">
                  {card.label}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section 2: Quick Actions ── */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
        <h2 className="text-[#212121] font-bold text-base mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                className="flex flex-col items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer bg-white hover:bg-green-50 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-1 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${action.iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="text-[#212121] font-semibold text-sm leading-snug">
                    {action.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Recent Uploads ── */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
        <h2 className="text-[#212121] font-bold text-base mb-4">Recent Uploads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 pr-4 font-semibold text-gray-500 whitespace-nowrap">File Name</th>
                <th className="pb-3 pr-4 font-semibold text-gray-500 whitespace-nowrap">Type</th>
                <th className="pb-3 pr-4 font-semibold text-gray-500 whitespace-nowrap">Records</th>
                <th className="pb-3 pr-4 font-semibold text-gray-500 whitespace-nowrap">Uploaded By</th>
                <th className="pb-3 pr-4 font-semibold text-gray-500 whitespace-nowrap">Date</th>
                <th className="pb-3 font-semibold text-gray-500 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="py-3 pr-4 text-[#212121] font-medium whitespace-nowrap">
                    {row.file}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{row.type}</td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {row.records} records
                  </td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {row.uploadedBy}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[row.status]}`}
                    >
                      {row.status}
                      {row.errorNote && (
                        <span className="text-red-400 font-normal">
                          — {row.errorNote}
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: Doctor Tier Distribution ── */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
        <h2 className="text-[#212121] font-bold text-base mb-5">
          Doctor Tier Distribution
        </h2>
        <div className="flex flex-col gap-5">
          {tiers.map((t) => (
            <div key={t.tier} className="flex items-center gap-4">
              {/* tier badge */}
              <span
                className={`w-16 flex-shrink-0 inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${t.badgeBg} ${t.badgeText}`}
              >
                Tier {t.tier}
              </span>

              {/* count */}
              <span className="w-28 flex-shrink-0 text-sm text-gray-600 font-medium">
                {t.count.toLocaleString()} doctors
              </span>

              {/* progress bar */}
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.barColor}`}
                  style={{ width: `${t.percent}%` }}
                />
              </div>

              {/* percent */}
              <span className="w-10 flex-shrink-0 text-right text-sm font-semibold text-gray-500">
                {t.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
