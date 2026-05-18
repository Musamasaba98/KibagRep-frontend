import { Link } from "react-router-dom";
import { icons } from "../assets/assets";
import { MdKeyboardArrowRight, MdVerified } from "react-icons/md";
import { FaShieldAlt } from "react-icons/fa";
import { HiLightningBolt } from "react-icons/hi";

const TRUST_BADGES = [
  { icon: MdVerified, label: "Verified HCP Database" },
  { icon: FaShieldAlt, label: "GPS-enforced visits" },
  { icon: HiLightningBolt, label: "Real-time sync" },
];

const HeroSection = () => {
  return (
    <section className="w-full bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#14532d] relative overflow-hidden pb-28 pt-16 md:pt-16">

      <div className="w-[90%] 2xl:w-[70%] mx-auto relative z-10">
        <div className="flex w-full flex-col md:flex-row items-center gap-12 md:gap-8">

          {/* Left — copy */}
          <div className="text-center md:text-left">

            <h1 className="font-poppins-extrabold text-4xl md:text-5xl lg:text-[56px] text-white leading-[1.1] tracking-tight max-w-2xl mx-auto md:mx-0">
              Field force{" "}
              <span className="text-[#4ade80]">accountability</span>{" "}
              that every team needs.
            </h1>

            <p className="text-white/80 font-poppins-semibold text-md md:text-md pt-5 leading-relaxed max-w-xl mx-auto md:mx-0">
              KibagRep owns the verified doctor and pharmacy database for Uganda.
              Your reps work from live, trusted data — not stale Excel lists.
              GPS integrity, call cycles, and approval chains enforced automatically.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-9 justify-center md:justify-start">
              <Link
              to="/signup"
              className="flex items-center justify-center gap-2 bg-white text-[#16a34a] px-7 py-3.5 rounded-xl font-poppins text-[15px] hover:bg-[#f0fdf4] active:bg-[#dcfce7] shadow-lg shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
              >Start free trial
              <MdKeyboardArrowRight className="w-5 h-5" />
              </Link>
              <a
              href="#features"
              className="flex items-center justify-center gap-2 border-2 border-white/40 text-white px-7 py-3.5 rounded-xl font-poppins text-[15px] hover:bg-white/10 active:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
              >See how it works
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 pt-8 justify-center md:justify-start">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <Icon className="w-4 h-4 text-[#4ade80] shrink-0" />
                  <p className="font-poppins">{label}</p>
                </div>
              ))}
            </div>
          </div>


          {/* Right — product image */}
          <div className="flex-1 flex justify-center md:justify-end w-full md:max-w-none">
            <div className="relative w-full max-w-sm md:max-w-lg">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-3xl scale-90 pointer-events-none" />
              <img
                src={icons.hero_img}
                alt="KibagRep dashboard preview"
                className="relative w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-16 md:h-24"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
