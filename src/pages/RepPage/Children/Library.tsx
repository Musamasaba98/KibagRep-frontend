import { useState, useEffect } from 'react';
import { FiBook, FiDownload, FiExternalLink, FiFileText, FiImage, FiVideo, FiFilter } from 'react-icons/fi';
import { getLibraryApi, getProductsApi } from '../../../services/api';

interface LitItem {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size_kb?: number;
  product?: { id: string; product_name: string } | null;
  created_at: string;
}

const FileIcon = ({ type }: { type: string }) => {
  if (type === 'pdf')   return <FiFileText className="w-5 h-5 text-red-500" />;
  if (type === 'image') return <FiImage className="w-5 h-5 text-sky-500" />;
  if (type === 'video') return <FiVideo className="w-5 h-5 text-violet-500" />;
  return <FiBook className="w-5 h-5 text-gray-400" />;
};

const typeColor = (type: string) => {
  if (type === 'pdf')   return 'bg-red-50 text-red-600 border-red-200';
  if (type === 'image') return 'bg-sky-50 text-sky-600 border-sky-200';
  if (type === 'video') return 'bg-violet-50 text-violet-600 border-violet-200';
  return 'bg-gray-50 text-gray-500 border-gray-200';
};

const formatSize = (kb?: number) => {
  if (!kb) return '';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const Library = () => {
  const [items, setItems]       = useState<LitItem[]>([]);
  const [products, setProducts] = useState<{ id: string; product_name: string }[]>([]);
  const [filterPid, setFilterPid] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getProductsApi().then((r) => setProducts(r.data.data ?? r.data)).catch(() => {});
    reload();
  }, []);

  useEffect(() => { reload(); }, [filterPid]);

  const reload = () => {
    setLoading(true);
    getLibraryApi(filterPid || undefined)
      .then((r) => setItems(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const filtered = items.filter((item) => {
    if (filterType && item.file_type !== filterType) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openFile = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Product Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">E-detailing materials and product literature</p>
        </div>
        <div className="w-9 h-9 bg-[#f0fdf4] rounded-xl flex items-center justify-center">
          <FiBook className="w-5 h-5 text-[#16a34a]" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px]">
          <input type="text" placeholder="Search materials…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <FiFilter className="w-4 h-4 text-gray-400" />
          <select value={filterPid} onChange={(e) => setFilterPid(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#16a34a] bg-white">
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#16a34a] bg-white">
            <option value="">All types</option>
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#16a34a] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <FiBook className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-semibold text-gray-500">No materials found</p>
          <p className="text-sm mt-1">{items.length === 0 ? 'Your admin hasn\'t uploaded any literature yet' : 'Try changing the filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id}
              className="bg-white rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] group"
              style={{ transition: 'box-shadow 0.2s' }}>
              {/* File type banner */}
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${typeColor(item.file_type)}`}>
                <FileIcon type={item.file_type} />
                <span className="text-xs font-bold uppercase tracking-wider">{item.file_type}</span>
                {item.file_size_kb && (
                  <span className="ml-auto text-[10px] opacity-60">{formatSize(item.file_size_kb)}</span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 py-3 flex-1">
                <p className="font-bold text-gray-800 text-sm leading-snug">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                )}
                {item.product && (
                  <span className="inline-block mt-2 text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] border border-[#dcfce7] px-2 py-0.5 rounded-full">
                    {item.product.product_name}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={() => openFile(item.file_url)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold py-2 rounded-xl focus-visible:outline-none"
                  style={{ transition: 'background-color 0.15s' }}>
                  <FiExternalLink className="w-3.5 h-3.5" />
                  Open
                </button>
                <a href={item.file_url} download target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  style={{ transition: 'background-color 0.15s, color 0.15s' }}>
                  <FiDownload className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
