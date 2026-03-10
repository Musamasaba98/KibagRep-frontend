import { useState } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { MdKeyboardArrowRight } from "react-icons/md";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.05)]">
        <div className="w-[90%] 2xl:w-[70%] mx-auto h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded-lg">
            <div className="w-8 h-8 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-sm shadow-green-700/20">
              <span className="text-white font-black text-sm tracking-tight">K</span>
            </div>
            <span className="font-black text-[#1a1a1a] text-xl tracking-tight">
              Kibag<span className="text-[#16a34a]">Rep</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-[15px] font-medium text-gray-600 hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-[15px] font-semibold text-gray-700 hover:text-[#16a34a] px-4 py-2 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white text-[15px] font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-green-700/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
            >
              Get started free
              <MdKeyboardArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
            aria-label="Open menu"
          >
            <HiMenuAlt3 className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          style={{ opacity: drawerOpen ? 1 : 0, transition: "opacity 200ms ease" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl md:hidden flex flex-col"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-black text-[#1a1a1a] text-xl tracking-tight">
            Kibag<span className="text-[#16a34a]">Rep</span>
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
            aria-label="Close menu"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center px-4 py-3 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-[#f0fdf4] hover:text-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Drawer CTAs */}
        <div className="px-4 pb-8 flex flex-col gap-3">
          <Link
            to="/login"
            onClick={() => setDrawerOpen(false)}
            className="w-full text-center py-3 px-4 rounded-xl text-[15px] font-semibold text-[#16a34a] border-2 border-[#16a34a] hover:bg-[#f0fdf4] active:bg-[#dcfce7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            onClick={() => setDrawerOpen(false)}
            className="w-full text-center py-3 px-4 rounded-xl text-[15px] font-semibold bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white shadow-sm shadow-green-700/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
