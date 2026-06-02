import { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "kibag_install_dismissed";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
      <div className="bg-white border border-[#dcfce7] rounded-2xl shadow-[0_8px_32px_0_rgba(22,163,74,0.18)] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#16a34a] flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg leading-none">K</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a2530] text-sm">Add KibagRep to your phone</p>
          <p className="text-xs text-gray-400 mt-0.5">Works offline · logs visits without internet</p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
              style={{ transition: "background-color 0.15s" }}
            >
              <FiDownload className="w-3 h-3" /> Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg"
              style={{ transition: "color 0.15s" }}
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
