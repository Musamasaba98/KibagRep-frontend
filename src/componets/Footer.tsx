import { Link } from "react-router-dom";
import { FaLinkedin, FaInstagram, FaYoutube, FaXTwitter } from "react-icons/fa6";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

const QUICK_LINKS = ["Features", "Pricing", "Docs", "About", "Contact"];
const SUPPORT_LINKS = ["FAQ", "Help Centre", "Blog", "API Docs", "Status"];

const SOCIAL = [
  { icon: FaLinkedin, label: "LinkedIn", href: "#" },
  { icon: FaInstagram, label: "Instagram", href: "#" },
  { icon: FaXTwitter, label: "X / Twitter", href: "#" },
  { icon: FaYoutube, label: "YouTube", href: "#" },
];

const Footer = () => {
  return (
    <footer className="w-full bg-[#111827] relative overflow-hidden pt-20 pb-10">

      {/* Dot texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-[90%] 2xl:w-[70%] mx-auto relative z-10">

        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-white/10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded-lg">
              <div className="w-8 h-8 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-sm shadow-green-700/30">
                <span className="text-white font-black text-sm tracking-tight">K</span>
              </div>
              <span className="font-black text-white text-xl tracking-tight">KibagRep</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[220px]">
              Uganda's verified HCP database and medical SFA platform. Accountability by design.
            </p>

            {/* Social */}
            <div className="flex gap-3 mt-5">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#16a34a] hover:border-[#16a34a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-[15px] mb-5">Quick links</h4>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-gray-400 text-sm hover:text-[#4ade80] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors cursor-pointer"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-[15px] mb-5">Support</h4>
            <ul className="flex flex-col gap-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm hover:text-[#4ade80] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] rounded transition-colors cursor-pointer"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-[15px] mb-5">Contact info</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <MdEmail className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <a
                  href="mailto:support@kibagrep.com"
                  className="text-gray-400 text-sm hover:text-[#4ade80] transition-colors cursor-pointer"
                >
                  support@kibagrep.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MdPhone className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">+256 775 345 245</span>
              </div>
              <div className="flex items-start gap-3">
                <MdLocationOn className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-gray-400 text-sm">Kampala, Uganda</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} KibagRep. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 text-sm hover:text-[#4ade80] transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 text-sm hover:text-[#4ade80] transition-colors cursor-pointer">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
