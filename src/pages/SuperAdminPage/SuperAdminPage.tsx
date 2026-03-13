import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { FaBuilding, FaHouse, FaBars, FaXmark, FaUsers } from 'react-icons/fa6';
import { SlLogout } from 'react-icons/sl';

const navBase = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium';
const active  = 'bg-[#16a34a]/10 text-[#16a34a] font-semibold';
const inactive = 'text-gray-600 hover:bg-gray-100';

const NAV = [
  { to: '/super-admin',           end: true,  icon: FaHouse,    label: 'Dashboard' },
  { to: '/super-admin/companies', end: false, icon: FaBuilding, label: 'Companies' },
  { to: '/super-admin/users',     end: false, icon: FaUsers,    label: 'All Users' },
];

const SidebarContent = ({ onNav }: { onNav?: () => void }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <>
      <div className='px-5 py-4 border-b border-gray-100 shrink-0'>
        <h1 className='font-black text-lg text-[#1a2530] tracking-tight'>
          KIBAG<span className='text-[#16a34a]'>REP</span>
        </h1>
        <p className='text-[11px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wider'>Super Admin</p>
      </div>
      <nav className='flex flex-col gap-0.5 p-3 flex-1'>
        {NAV.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end} onClick={onNav}
            className={({ isActive }: { isActive: boolean }) => `${navBase} ${isActive ? active : inactive}`}>
            <Icon className='w-4 h-4 shrink-0' /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className='p-3 border-t border-gray-100 shrink-0'>
        <button onClick={() => { dispatch(logout()); navigate('/login'); }}
          className={`${navBase} text-red-500 hover:bg-red-50 w-full text-left focus-visible:outline-none`}>
          <SlLogout className='w-4 h-4 shrink-0' /><span>Logout</span>
        </button>
      </div>
    </>
  );
};

const SuperAdminPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className='min-h-screen flex bg-gray-50'>
      {/* Desktop sidebar */}
      <div className='hidden lg:flex w-56 bg-white border-r border-gray-200 h-screen fixed flex-col shrink-0 z-20'>
        <SidebarContent />
      </div>
      {/* Mobile drawer */}
      {drawerOpen && (
        <div className='fixed inset-0 z-40 flex lg:hidden'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setDrawerOpen(false)} />
          <div className='relative w-64 bg-white h-full flex flex-col shadow-2xl z-50'>
            <button onClick={() => setDrawerOpen(false)} className='absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 focus-visible:outline-none'>
              <FaXmark className='w-4 h-4' />
            </button>
            <SidebarContent onNav={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
      {/* Main */}
      <div className='flex-1 lg:ml-56 min-w-0'>
        <div className='h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-10'>
          <button onClick={() => setDrawerOpen(true)} className='lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none'>
            <FaBars className='w-4 h-4' />
          </button>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 bg-[#16a34a] rounded-lg flex items-center justify-center shrink-0'>
              <span className='text-white font-black text-[10px]'>K</span>
            </div>
            <span className='text-sm font-semibold text-gray-500 truncate'>Platform Administration</span>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminPage;
