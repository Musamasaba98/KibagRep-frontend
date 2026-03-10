import { FaStar } from "react-icons/fa6";

const TESTIMONIALS = [
  {
    quote:
      "Before KibagRep, I had no reliable way to know if my reps were actually visiting doctors or just filing reports. Now I see every visit GPS-stamped in real time.",
    name: "Samuel Okello",
    title: "Regional Sales Manager",
    company: "Mega Lifesciences Uganda",
    initials: "SO",
    color: "bg-[#16a34a]",
  },
  {
    quote:
      "The call cycle enforcement alone saved us weeks of wasted visits. Reps now see exactly which doctors are due and in what tier — no more guessing.",
    name: "Grace Namutebi",
    title: "Country Manager",
    company: "Veeram Pharmaceuticals",
    initials: "GN",
    color: "bg-[#15803d]",
  },
  {
    quote:
      "Phyzii let reps fake GPS and arbitrarily change doctor lists. KibagRep makes both impossible. The accountability shift happened in the first week.",
    name: "David Ssemakula",
    title: "Medical Sales Supervisor",
    company: "Abacus Pharma",
    initials: "DS",
    color: "bg-[#166534]",
  },
];

const SocialProof = () => {
  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="w-[90%] 2xl:w-[70%] mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#16a34a] font-bold text-sm tracking-widest uppercase mb-3">
            Trusted by field teams
          </p>
          <h2 className="font-black text-3xl md:text-4xl text-[#1a1a1a] tracking-tight">
            What managers say after switching
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, title, company, initials, color }) => (
            <div
              key={name}
              className="flex flex-col bg-white rounded-2xl p-7 border border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_0_rgba(22,163,74,0.10)] hover:-translate-y-1"
              style={{ transition: "box-shadow 0.25s ease, transform 0.25s ease" }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="w-4 h-4 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-[15px] leading-relaxed flex-1 mb-6">
                "{quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
                  <span className="text-white font-black text-sm">{initials}</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] text-sm leading-tight">{name}</p>
                  <p className="text-gray-400 text-xs leading-tight mt-0.5">
                    {title} · {company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company strip */}
        <div className="mt-14 pt-10 border-t border-gray-200">
          <p className="text-center text-gray-400 text-sm font-medium mb-7 tracking-wide uppercase">
            Used by pharma field teams across Uganda
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Mega Lifesciences",
              "Veeram Pharma",
              "Abacus Pharma",
              "Kampala Pharmaceuticals",
              "NovaMed Uganda",
              "EastAfrica BioScience",
            ].map((name) => (
              <div
                key={name}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm font-semibold hover:border-[#16a34a] hover:text-[#16a34a] cursor-default"
                style={{ transition: "border-color 0.2s, color 0.2s" }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
