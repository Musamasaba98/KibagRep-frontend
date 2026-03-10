import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdKeyboardArrowRight, MdClose } from "react-icons/md";

const StickyBar = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (!dismissed) {
        setVisible(window.scrollY > 520);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 300ms ease, transform 300ms ease",
      }}
    >
      <div className="pointer-events-auto flex items-center gap-4 bg-[#1a1a1a] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 max-w-xl w-full">
        {/* Pulse dot */}
        <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse shrink-0" />

        {/* Message */}
        <p className="text-sm font-medium text-white/90 flex-1 leading-snug">
          Uganda's verified HCP database — your reps deserve better than Excel.
        </p>

        {/* CTA */}
        <Link
          to="/signup"
          className="flex items-center gap-1 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white text-sm font-bold px-4 py-2 rounded-xl shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4ade80] transition-colors"
        >
          Start free
          <MdKeyboardArrowRight className="w-4 h-4" />
        </Link>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 transition-colors"
          aria-label="Dismiss"
        >
          <MdClose className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StickyBar;
