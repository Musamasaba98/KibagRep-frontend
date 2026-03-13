import { useState, useRef } from "react";
import { FaArrowUpFromBracket, FaFileExcel, FaCircleCheck, FaXmark } from "react-icons/fa6";

type UploadType = "doctors" | "pharmacies" | "products";

interface UploadState {
  file: File | null;
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  count: number;
}

const UPLOAD_TYPES: { type: UploadType; label: string; desc: string; color: string; bg: string; columns: string[] }[] = [
  {
    type: "doctors",
    label: "Doctor List",
    desc: "Upload a list of doctors to add to the platform database",
    color: "text-[#16a34a]",
    bg: "bg-green-50",
    columns: ["doctor_name", "speciality", "town", "district", "contact", "facility_name"],
  },
  {
    type: "pharmacies",
    label: "Pharmacy List",
    desc: "Upload pharmacies with their location and contact details",
    color: "text-sky-600",
    bg: "bg-sky-50",
    columns: ["pharmacy_name", "town", "district", "contact", "latitude", "longitude"],
  },
  {
    type: "products",
    label: "Product Catalogue",
    desc: "Upload your company's product list with classification",
    color: "text-purple-600",
    bg: "bg-purple-50",
    columns: ["product_name", "generic_name", "classification (CASH_COW/NEW_LAUNCH/GROWTH/DECLINING)"],
  },
];

const UploadCard = ({ config }: { config: typeof UPLOAD_TYPES[0] }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ file: null, status: "idle", message: "", count: 0 });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      setState(s => ({ ...s, status: "error", message: "Only .xlsx, .xls, or .csv files are accepted" }));
      return;
    }
    setState({ file: f, status: "idle", message: "", count: 0 });
  };

  const handleUpload = async () => {
    if (!state.file) return;
    setState(s => ({ ...s, status: "uploading", message: "" }));
    const formData = new FormData();
    formData.append("file", state.file);
    try {
      const res = await fetch(`http://localhost:4000/api/bulk-upload/${config.type}`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Upload failed");
      setState(s => ({ ...s, status: "success", message: data.message || "Upload complete", count: data.count ?? 0 }));
    } catch (err: any) {
      setState(s => ({ ...s, status: "error", message: err.message || "Upload failed" }));
    }
  };

  const reset = () => {
    setState({ file: null, status: "idle", message: "", count: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <FaFileExcel className={`w-4 h-4 ${config.color}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1a2530]">{config.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{config.desc}</p>
        </div>
      </div>

      {/* Required columns */}
      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Required columns</p>
        <div className="flex flex-wrap gap-1">
          {config.columns.map(col => (
            <span key={col} className="text-[10px] font-mono bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* File drop zone */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#16a34a]/40 hover:bg-green-50/30"
        style={{ transition: "border-color 0.15s, background-color 0.15s" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) { const dt = new DataTransfer(); dt.items.add(f); if (inputRef.current) inputRef.current.files = dt.files; handleFile({ target: inputRef.current } as any); }
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        {state.file ? (
          <div className="flex items-center justify-center gap-2">
            <FaFileExcel className="w-4 h-4 text-[#16a34a]" />
            <span className="text-sm font-semibold text-[#1a2530] truncate max-w-[200px]">{state.file.name}</span>
            <button onClick={e => { e.stopPropagation(); reset(); }} className="text-gray-400 hover:text-red-500 focus-visible:outline-none">
              <FaXmark className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <FaArrowUpFromBracket className="w-5 h-5 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Drop your file here or <span className="text-[#16a34a] font-semibold">browse</span></p>
            <p className="text-[11px] text-gray-300 mt-1">.xlsx, .xls, .csv — max 5MB</p>
          </>
        )}
      </div>

      {/* Status message */}
      {state.status === "success" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-[#16a34a] text-sm px-3 py-2.5 rounded-xl">
          <FaCircleCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{state.message}{state.count > 0 ? ` · ${state.count} records imported` : ""}</span>
        </div>
      )}
      {state.status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">{state.message}</div>
      )}

      {/* Upload button */}
      <button
        disabled={!state.file || state.status === "uploading"}
        onClick={handleUpload}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        style={{ transition: "background-color 0.15s" }}>
        {state.status === "uploading" ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Uploading…</span></>
        ) : (
          <><FaArrowUpFromBracket className="w-3.5 h-3.5" /><span>Upload {config.label}</span></>
        )}
      </button>
    </div>
  );
};

const BulkUpload = () => (
  <div className="p-4 sm:p-6 flex flex-col gap-5">
    <div>
      <h1 className="text-xl sm:text-2xl font-black text-[#1a2530] tracking-tight">Bulk Upload</h1>
      <p className="text-sm text-gray-400 mt-0.5">Import doctors, pharmacies, and products from Excel files</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {UPLOAD_TYPES.map(t => <UploadCard key={t.type} config={t} />)}
    </div>
    <div className="bg-[#0f2318] rounded-2xl p-5 text-sm">
      <p className="text-white font-bold mb-2">Before uploading</p>
      <ul className="text-white/60 text-xs flex flex-col gap-1.5 list-disc list-inside">
        <li>Use the exact column names shown above — spelling matters</li>
        <li>Remove any merged cells or header rows beyond row 1</li>
        <li>Duplicate entries (matching name + town) will be skipped, not duplicated</li>
        <li>Maximum 1,000 rows per upload file</li>
      </ul>
    </div>
  </div>
);

export default BulkUpload;
