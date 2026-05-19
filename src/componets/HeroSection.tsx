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
    <section className="w-full relative overflow-hidden pb-28 pt-16 md:pt-16">
      {/* Background texture dots */}
      <div
        className="absolute z-[-1] inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #b7f7cd 2px, transparent 2px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-[90%] 2xl:w-[70%] mx-auto relative z-10">
        <div className="flex w-full flex-row items-center gap-12 md:gap-8">

          {/* The hero section container */}
          <div className="text-center mt-6 md:text-left">

            <h1 className="text-gray-700 font-poppins-extrabold text-4xl md:text-5xl lg:text-[56px] leading-[1.1] tracking-tight max-w-4xl mx-auto md:mx-0">
              Field force{" "}
              <span className="text-green-500">accountability</span>{" "}
              that every team needs.
            </h1>

            <p className="text-gray-700 font-poppins text-md md:text-md pt-5 leading-relaxed max-w-3xl mx-auto md:mx-0">
              KibagRep owns the verified doctor and pharmacy database for Uganda.
              Your reps work from live, trusted data — not stale Excel lists.
              GPS integrity, call cycles, and approval chains enforced automatically.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-9 justify-center md:justify-start">
              <Link
              to="/signup"
              className="flex items-center text-white justify-center gap-2 bg-[#16a34a] px-7 py-3.5 rounded-xl font-poppins text-[15px] shadow-lg shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors">
              Start free trial
              <MdKeyboardArrowRight className="w-5 text-white h-5" />
              </Link>
              <a
              href="#features"
              className="flex items-center font-[poppins-semibold] text-sm text-[#16a34a] justify-center gap-2 border-2 border-[#16a34a] px-7 py-3.5 rounded-xl"
              >See how it works
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-5 pt-8 justify-center md:justify-start">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <Icon className="w-4 h-4 text-[#4ade80] shrink-0" />
                  <p className="font-poppins text-gray-700">{label}</p>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>

    </section>
  );
};

export default HeroSection;