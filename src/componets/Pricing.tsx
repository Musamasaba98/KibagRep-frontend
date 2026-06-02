import { Link } from "react-router-dom";
import { BiCheck } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";

const PLANS = [
  {
    name: "Starter",
    price: "60,000",
    currency: "UGX",
    priceNote: "per rep / month",
    annualNote: "Pay 10, get 12 months free on annual",
    repRange: "Up to 10 reps",
    description: "For small pharma field teams moving off Excel onto a real accountability platform.",
    cta: "Request access",
    ctaTo: "#request-demo",
    highlighted: false,
    features: [
      "Up to 10 medical reps",
      "GPS-verified visit logging",
      "Call cycle management",
      "Daily report submission & approval",
      "Expense claims",
      "HCP directory access",
      "Excel report download",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "50,000",
    currency: "UGX",
    priceNote: "per rep / month",
    annualNote: "Pay 10, get 12 months free on annual",
    repRange: "11 – 50 reps",
    description: "For growing teams that need supervisor approval chains, JFW coaching, and full field accountability.",
    cta: "Book a demo",
    ctaTo: "#request-demo",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Up to 50 medical reps",
      "Everything in Starter",
      "Supervisor approval workflows",
      "Joint Field Work (JFW) scoring",
      "Tour plan management",
      "Pharmacy visit + stock tracking",
      "Field events (CME, OPD breakfasts)",
      "GPS anomaly flagging",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Negotiated",
    currency: "",
    priceNote: "volume discount applied",
    annualNote: "Annual contract · custom SLA",
    repRange: "50+ reps",
    description: "For national pharma companies that need country-level visibility, multi-tenant control, and a dedicated account team.",
    cta: "Talk to us",
    ctaTo: "#request-demo",
    highlighted: false,
    features: [
      "Unlimited reps across regions",
      "Everything in Growth",
      "Country Manager dashboard",
      "Multi-company / multi-tenant",
      "Doctor & pharmacy self-service portals",
      "CME and incentive tracking",
      "Onboarding & data migration",
      "Dedicated account manager",
      "SLA-backed uptime guarantee",
    ],
  },
];

const Pricing = () => {
  return (
    <section id="pricing-plans" className="w-full bg-white py-20">
      <div className="w-[90%] 2xl:w-[70%] mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-5">
          <p className="text-[#16a34a] font-poppins-bold text-sm tracking-widest uppercase mb-3">
            Pricing
          </p>
          <h2 className="font-poppins-extrabold text-3xl md:text-4xl text-[#1a1a1a] tracking-tight leading-tight">
            Simple plans for every team size
          </h2>
          <p className="text-gray-500 font-poppins text-md mt-4 leading-relaxed">
            Pay per rep seat. No setup fees. Cancel any time.
            Priced for Uganda and East Africa — not for Europe.
          </p>
        </div>

        {/* ROI callout */}
        <div className="max-w-2xl mx-auto mb-12 bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl px-6 py-4 text-center">
          <p className="text-[#15803d] font-poppins text-sm leading-relaxed">
            <span className="font-poppins-bold">The math is simple:</span> if KibagRep helps you recover just one ghost visit per rep per week,
            the platform pays for itself — and then some. Most teams see ROI in the first month.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(({ name, price, currency, priceNote, annualNote, repRange, description, cta, ctaTo, highlighted, badge, features }) => (
            <div
              key={name}
              className={`flex flex-col rounded-2xl p-7 border ${
                highlighted
                  ? "bg-[#16a34a] border-[#15803d] shadow-[0_8px_40px_0_rgba(22,163,74,0.30)]"
                  : "bg-white border-gray-100 shadow-[0_2px_16px_0_rgba(0,0,0,0.06)]"
              }`}
            >
              {/* Badge */}
              {badge && (
                <div className="inline-flex self-start mb-4">
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                    {badge}
                  </span>
                </div>
              )}

              {/* Rep range chip */}
              <span className={`self-start text-[11px] font-poppins-bold px-2.5 py-1 rounded-full mb-3 ${
                highlighted ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {repRange}
              </span>

              {/* Plan name */}
              <h3 className={`font-poppins-extrabold text-xl mb-2 ${highlighted ? "text-white" : "text-[#1a1a1a]"}`}>
                {name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className={`font-poppins-extrabold text-4xl leading-none ${highlighted ? "text-white" : "text-[#16a34a]"}`}>
                  {price}
                </span>
                {currency && (
                  <span className={`font-poppins-bold text-base ${highlighted ? "text-white/80" : "text-[#16a34a]"}`}>
                    {currency}
                  </span>
                )}
              </div>
              <p className={`text-xs font-poppins mb-1 ${highlighted ? "text-white/70" : "text-gray-400"}`}>
                {priceNote}
              </p>
              <p className={`text-[11px] font-poppins-semibold mb-5 ${highlighted ? "text-white/60" : "text-gray-300"}`}>
                {annualNote}
              </p>

              {/* Description */}
              <p className={`text-[14px] font-poppins leading-relaxed mb-6 ${highlighted ? "text-white/80" : "text-gray-500"}`}>
                {description}
              </p>

              {/* CTA */}
              <a
                href={ctaTo}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-poppins-bold text-[15px] mb-7 focus-visible:outline focus-visible:outline-2 transition-colors ${
                  highlighted
                    ? "bg-white text-[#16a34a] hover:bg-[#f0fdf4] active:bg-[#dcfce7] focus-visible:outline-white"
                    : "bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] focus-visible:outline-[#16a34a] shadow-sm shadow-green-700/20"
                }`}
              >
                {cta}
                <MdKeyboardArrowRight className="w-5 h-5" />
              </a>

              {/* Feature list */}
              <div className="flex flex-col gap-3 mt-auto">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      highlighted ? "bg-white/20" : "bg-[#dcfce7]"
                    }`}>
                      <BiCheck className={`w-3.5 h-3.5 ${highlighted ? "text-white" : "text-[#16a34a]"}`} />
                    </div>
                    <p className={`text-sm font-poppins leading-snug ${highlighted ? "text-white/90" : "text-gray-600"}`}>
                      {f}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom notes */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 font-poppins">
          <span>✓ All plans include the verified Uganda HCP database</span>
          <span className="hidden sm:block text-gray-200">·</span>
          <span>✓ Onboarding support included</span>
          <span className="hidden sm:block text-gray-200">·</span>
          <span>
            ✓ Questions?{" "}
            <a href="mailto:support@kibagrep.com" className="text-[#16a34a] font-poppins-semibold hover:underline">
              support@kibagrep.com
            </a>
          </span>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
