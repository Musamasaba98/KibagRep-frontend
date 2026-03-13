import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import MenuPopup from "../../componets/MenuPopup/MenuPopup";
import { useSelector, useDispatch } from 'react-redux';
import { toggleShowNca, toggleShowUnplanned } from '../../store/uiStateSlice';
import AddUnplanned from '../../componets/AddUnplanned/AddUnplanned';
import Ncapopup from '../../componets/NcaPoppup/Ncapopup';
import LogVisitModal from '../../componets/LogVisitModal/LogVisitModal';
import PharmacyFabModal from '../../componets/LogPharmacyModal/PharmacyFabModal';
import { Outlet } from 'react-router-dom';
import { FaPlus, FaXmark, FaStethoscope, FaBan, FaCalendarPlus } from 'react-icons/fa6';
import { TbPill } from 'react-icons/tb';

const SPEED_DIAL = [
  { key: 'visit'     as const, label: 'Log Visit',  Icon: FaStethoscope, color: 'bg-[#16a34a] hover:bg-[#15803d]', shadow: 'shadow-green-600/30' },
  { key: 'pharmacy'  as const, label: 'Log Pharmacy', Icon: TbPill,       color: 'bg-violet-600 hover:bg-violet-700', shadow: 'shadow-violet-600/30' },
  { key: 'nca'       as const, label: 'Log NCA',    Icon: FaBan,         color: 'bg-amber-500 hover:bg-amber-600',  shadow: 'shadow-amber-500/30'  },
  { key: 'unplanned' as const, label: 'Unplanned',  Icon: FaCalendarPlus,color: 'bg-sky-600 hover:bg-sky-700',      shadow: 'shadow-sky-600/30'    },
];

const RepPage = () => {
  const dispatch = useDispatch();
  const showMenu: boolean = useSelector((state: any) => state.uiState.showMenu);
  const showSidebarPanel: boolean = useSelector((state: any) => state.uiState.showSidebarPanel ?? true);
  // NCA and Unplanned are Redux-driven so MenuPopup can also trigger them
  const showNca: boolean = useSelector((state: any) => state.uiState.showNca);
  const showUnplanned: boolean = useSelector((state: any) => state.uiState.showUnplanned);
  const [showLogVisit,    setShowLogVisit]    = useState(false);
  const [showLogPharmacy, setShowLogPharmacy] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleVisitSuccess = () => setRefreshKey((k) => k + 1);

  const openModal = (key: 'visit' | 'nca' | 'unplanned') => {
    setFabOpen(false);
    if (key === 'visit')     setShowLogVisit(true);
    if (key === 'pharmacy')  setShowLogPharmacy(true);
    if (key === 'nca')       dispatch(toggleShowNca());
    if (key === 'unplanned') dispatch(toggleShowUnplanned());
  };

  return (
    <>
      <MenuPopup showMenu={showMenu} />

      {showLogVisit    && <LogVisitModal    onClose={() => setShowLogVisit(false)}    onSuccess={handleVisitSuccess} />}
      {showLogPharmacy && <PharmacyFabModal onClose={() => setShowLogPharmacy(false)} onSuccess={handleVisitSuccess} />}
      {showNca       && <Ncapopup       onClose={() => dispatch(toggleShowNca())}         onSuccess={handleVisitSuccess} />}
      {showUnplanned && <AddUnplanned   onClose={() => dispatch(toggleShowUnplanned())}   onSuccess={handleVisitSuccess} />}

      {fabOpen && <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />}

      <div className="w-full bg-gray-100 min-h-screen overflow-x-hidden">
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

      {/* Speed-dial FAB */}
      <div
        className="fixed z-40 flex flex-col items-end gap-3"
        style={{ bottom: isMobile ? 72 : 32, right: isMobile ? 20 : 32 }}
      >
        {SPEED_DIAL.map(({ key, label, Icon, color, shadow }, i) => (
          <div
            key={key}
            className="flex items-center gap-2"
            style={{
              opacity: fabOpen ? 1 : 0,
              transform: fabOpen ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.85)',
              transition: fabOpen
                ? `opacity 0.18s ease ${i * 0.05}s, transform 0.18s ease ${i * 0.05}s`
                : `opacity 0.12s ease ${(SPEED_DIAL.length - 1 - i) * 0.04}s, transform 0.12s ease ${(SPEED_DIAL.length - 1 - i) * 0.04}s`,
              pointerEvents: fabOpen ? 'auto' : 'none',
            }}
          >
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              {label}
            </span>
            <button
              type="button"
              onClick={() => openModal(key)}
              aria-label={label}
              className={`${color} ${shadow} text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              style={{ transition: 'background-color 0.15s' }}
            >
              <Icon className="w-4 h-4" />
            </button>
          </div>
        ))}

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
