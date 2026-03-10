import { icons } from "../assets/assets";
import { FaUserGroup, FaDatabase } from "react-icons/fa6";
import { BiBarChart } from "react-icons/bi";
import { MdGpsFixed } from "react-icons/md";

const POINTS = [
  {
    icon: FaUserGroup,
    title: "Managing medical reps has never been this clear",
    body: "Assign territories, approve call cycles, and track visits — all from one dashboard. No more chasing Excel sheets.",
  },
  {
    icon: MdGpsFixed,
    title: "GPS-enforced accountability, not just logging",
    body: "Every visit is verified against the doctor's registered facility. Fake GPS is flagged automatically — not by managers guessing.",
  },
  {
    icon: FaDatabase,
    title: "Uganda's verified HCP database is the foundation",
    body: "Doctors and pharmacies maintain their own profiles. Your reps always call on accurate, up-to-date records.",
  },
  {
    icon: BiBarChart,
    title: "Insight on load, not after a week of report pulling",
    body: "Country managers see national KPIs the moment they log in. No waiting, no manual aggregation, no guesswork.",
  },
];

const AboutBanner = () => {
  return (
    <section id="about" className="w-full bg-gradient-to-br from-[#16a34a] to-[#14532d] relative overflow-hidden py-24">

      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-[90%] 2xl:w-[70%] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-16">

          {/* Left — copy */}
          <div className="flex-1 w-full">
            <p className="text-[#4ade80] font-bold text-sm tracking-widest uppercase mb-4">
              Why KibagRep
            </p>
            <h2 className="font-black text-3xl md:text-4xl text-white tracking-tight leading-tight max-w-lg">
              Built specifically for Africa's healthcare challenges
            </h2>
            <p className="text-white/70 text-lg mt-4 leading-relaxed max-w-lg">
              Phyzii captured inputs. KibagRep enforces outcomes. Every feature is designed around the real problems of field sales in East Africa.
            </p>

            {/* Points */}
            <div className="flex flex-col gap-6 mt-10">
              {POINTS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#4ade80]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[15px] leading-tight">{title}</h3>
                    <p className="text-white/65 text-sm leading-relaxed mt-1">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image */}
          <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm lg:max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-3xl scale-90 pointer-events-none" />
              <img
                src={icons.hero_2_img}
                alt="Field rep using KibagRep"
                className="relative w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutBanner;
