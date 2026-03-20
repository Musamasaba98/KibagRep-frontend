import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MenuPopup from "../../componets/MenuPopup/MenuPopup";
import { useSelector } from 'react-redux';
import VisitGroupModal from '../../componets/VisitGroupModal/VisitGroupModal';
import NcaMissedGroupModal from '../../componets/NcaMissedGroupModal/NcaMissedGroupModal';
import PharmacyFabModal from '../../componets/LogPharmacyModal/PharmacyFabModal';
import FieldIntelGroupModal from '../../componets/FieldIntelGroupModal/FieldIntelGroupModal';
import { Outlet } from 'react-router-dom';
import { FaPlus, FaXmark, FaStethoscope, FaBan } from 'react-icons/fa6';
import { TbPill } from 'react-icons/tb';
import { FiEye } from 'react-icons/fi';

// ─── FAB actions (4 grouped) ──────────────────────────────────────────────────

const FAB_ACTIONS = [
  {
    key: 'visit'    as const,
    label: 'Log Visit',
    sub: 'Planned · Unplanned',
    Icon: FaStethoscope,
    bg: 'bg-[#f0fdf4]',
    iconColor: 'bg-[#16a34a]',
    text: 'text-[#15803d]',
    sub2: 'text-[#16a34a]/60',
    border: 'border-[#bbf7d0]',
  },
  {
    key: 'nca'      as const,
    label: 'NCA / Missed',
    sub: 'NCA · Missed · Skipped',
    Icon: FaBan,
    bg: 'bg-amber-50',
    iconColor: 'bg-amber-500',
    text: 'text-amber-700',
    sub2: 'text-amber-500/70',
    border: 'border-amber-200',
  },
  {
    key: 'pharmacy' as const,
    label: 'Pharmacy',
    sub: 'Log pharmacy visit',
    Icon: TbPill,
    bg: 'bg-violet-50',
    iconColor: 'bg-violet-600',
    text: 'text-violet-700',
    sub2: 'text-violet-500/70',
    border: 'border-violet-200',
  },
  {
    key: 'intel'    as const,
    label: 'Field Intel',
    sub: 'Competitor · Stock',
    Icon: FiEye,
    bg: 'bg-sky-50',
    iconColor: 'bg-sky-600',
    text: 'text-sky-700',
    sub2: 'text-sky-500/70',
    border: 'border-sky-200',
  },
] as const;

type FabKey = typeof FAB_ACTIONS[number]['key'];

// ─── RepPage ──────────────────────────────────────────────────────────────────

const RepPage = () => {
  const showMenu: boolean = useSelector((state: any) => state.uiState.showMenu);
  const showSidebarPanel: boolean = useSelector((state: any) => state.uiState.showSidebarPanel ?? true);

  const [showVisitGroup,   setShowVisitGroup]   = useState(false);
  const [visitInitialTab,  setVisitInitialTab]  = useState<'planned' | 'unplanned'>('planned');
  const [showNcaMissed,    setShowNcaMissed]    = useState(false);
  const [ncaMissedTab,     setNcaMissedTab]     = useState<'nca' | 'missed'>('nca');
  const [ncaMissedPrefill, setNcaMissedPrefill] = useState<{ doctorId?: string; doctorLabel?: string }>({});
  const [showPharmacy,     setShowPharmacy]     = useState(false);
  const [showFieldIntel,   setShowFieldIntel]   = useState(false);
  const [intelInitialTab,  setIntelInitialTab]  = useState<'competitor' | 'stock'>('competitor');

  const [fabOpen,    setFabOpen]    = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Listen for modal-open events fired by MenuPopup and other components
  useEffect(() => {
    const onLogMissed = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setNcaMissedPrefill({ doctorId: detail.doctorId });
      setNcaMissedTab('missed');
      setShowNcaMissed(true);
    };
    const onOpenVisit = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setVisitInitialTab(detail.tab === 'unplanned' ? 'unplanned' : 'planned');
      setShowVisitGroup(true);
    };
    const onOpenNca = () => {
      setNcaMissedTab('nca');
      setNcaMissedPrefill({});
      setShowNcaMissed(true);
    };
    const onOpenIntel = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setIntelInitialTab(detail.tab === 'stock' ? 'stock' : 'competitor');
      setShowFieldIntel(true);
    };

    window.addEventListener('kibag:log-missed',  onLogMissed);
    window.addEventListener('kibag:open-visit',  onOpenVisit);
    window.addEventListener('kibag:open-nca',    onOpenNca);
    window.addEventListener('kibag:open-intel',  onOpenIntel);
    return () => {
      window.removeEventListener('kibag:log-missed',  onLogMissed);
      window.removeEventListener('kibag:open-visit',  onOpenVisit);
      window.removeEventListener('kibag:open-nca',    onOpenNca);
      window.removeEventListener('kibag:open-intel',  onOpenIntel);
    };
  }, []);

  const handleSuccess = () => setRefreshKey((k) => k + 1);

  const openModal = (key: FabKey) => {
    setFabOpen(false);
    if (key === 'visit')    { setVisitInitialTab('planned'); setShowVisitGroup(true); }
    if (key === 'nca')      { setNcaMissedTab('nca'); setNcaMissedPrefill({}); setShowNcaMissed(true); }
    if (key === 'pharmacy') { setShowPharmacy(true); }
    if (key === 'intel')    { setIntelInitialTab('competitor'); setShowFieldIntel(true); }
  };

  return (
    <>
      <MenuPopup showMenu={showMenu} />

      {showVisitGroup && (
        <VisitGroupModal onClose={() => setShowVisitGroup(false)} onSuccess={handleSuccess} initialTab={visitInitialTab} />
      )}
      {showNcaMissed && (
        <NcaMissedGroupModal
          initialTab={ncaMissedTab}
          initialDoctorId={ncaMissedPrefill.doctorId}
          initialDoctorLabel={ncaMissedPrefill.doctorLabel}
          onClose={() => setShowNcaMissed(false)}
          onSuccess={() => { setShowNcaMissed(false); handleSuccess(); }}
        />
      )}
      {showPharmacy && (
        <PharmacyFabModal onClose={() => setShowPharmacy(false)} onSuccess={handleSuccess} />
      )}
      {showFieldIntel && (
        <FieldIntelGroupModal onClose={() => setShowFieldIntel(false)} onSuccess={() => setShowFieldIntel(false)} initialTab={intelInitialTab} />
      )}

      {/* Backdrop — closes FAB panel on outside click */}
      {fabOpen && <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />}

      <div className="w-full bg-gray-100 min-h-screen overflow-x-hidden pt-14 md:pt-16">
        <Navbar />
        <div className="w-full flex">
          <Sidebar />
          <div
            className="w-full p-4 md:p-7"
            style={{
              marginLeft: isMobile ? 0 : (showSidebarPanel ? 380 : 88),
              paddingBottom: isMobile ? 96 : undefined,
              transition: isMobile ? undefined : 'margin-left 250ms ease',
            }}
          >
            <Outlet context={{ refreshKey }} />
          </div>
        </div>
      </div>

      <MobileNav />

      {/* ── FAB ── */}
      <div
        className="fixed z-40 flex flex-col items-end gap-2"
        style={{ bottom: isMobile ? 72 : 32, right: isMobile ? 16 : 32 }}
      >
        {/* Action panel — glassmorphic vertical speed-dial */}
        <div className="flex flex-col items-end gap-3 pb-1" style={{ pointerEvents: fabOpen ? 'auto' : 'none' }}>
          {FAB_ACTIONS.map(({ key, label, sub, Icon, bg, iconColor, text, sub2, border }, i) => (
            <div
              key={key}
              className="flex items-center gap-3"
              style={{
                opacity: fabOpen ? 1 : 0,
                transform: fabOpen ? 'translateY(0)' : `translateY(${(FAB_ACTIONS.length - i) * 10}px)`,
                transition: `opacity 0.18s ease ${fabOpen ? i * 0.05 : (FAB_ACTIONS.length - 1 - i) * 0.04}s, transform 0.18s ease ${fabOpen ? i * 0.05 : (FAB_ACTIONS.length - 1 - i) * 0.04}s`,
              }}
            >
              {/* Label pill — action-tinted so it reads against white backgrounds */}
              <div
                className={`${bg} border ${border} px-3.5 py-2 rounded-full`}
                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
              >
                <span className={`text-xs font-bold ${text}`}>{label}</span>
                <span className={`ml-2 text-[10px] ${sub2}`}>{sub}</span>
              </div>

              {/* Circular icon button */}
              <button
                type="button"
                onClick={() => openModal(key)}
                className={`${iconColor} text-white w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg hover:brightness-110 active:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                style={{ transition: 'filter 0.12s' }}
              >
                <Icon className="w-[17px] h-[17px]" />
              </button>
            </div>
          ))}
        </div>

        {/* FAB trigger button */}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-label="Open actions"
          aria-expanded={fabOpen}
          className="bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white rounded-full shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a]"
          style={{ padding: isMobile ? '14px' : '14px 20px', transition: 'background-color 0.15s' }}
        >
          {fabOpen
            ? <FaXmark className="w-4 h-4" />
            : <><FaPlus className="w-4 h-4" />{!isMobile && <span>Actions</span>}</>}
        </button>
      </div>
    </>
  );
};

export default RepPage;
