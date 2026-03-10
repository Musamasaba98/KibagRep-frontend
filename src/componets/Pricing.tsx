import { Link } from "react-router-dom";
import { BiCheck } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";

const PLANS = [
  {
    name: "Starter",
    price: "Contact us",
    priceNote: "Up to 10 reps",
    description: "For small pharma field teams getting off Excel and onto a real SFA platform.",
    cta: "Get started",
    ctaTo: "/signup",
    highlighted: false,
    features: [
      "Up to 10 medical reps",
      "GPS-verified visit logging",
      "Call cycle management",
      "Basic KPI dashboard",
      "Daily report submission",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "Contact us",
    priceNote: "11 – 50 reps",
    description: "For growing teams who need supervisor approval chains, JFW, and campaign tracking.",
    cta: "Book a demo",
    ctaTo: "#pricing",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Up to 50 medical reps",
      "Everything in Starter",
      "Supervisor approval workflows",
      "Joint Field Work (JFW) scoring",
      "Active campaign briefs",
      "Expense claim management",
      "Territory coverage heatmap",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceNote: "Unlimited reps",
    description: "For national pharma companies that need country-level analytics, multi-tenant control, and custom integrations.",
    cta: "Talk to sales",
    ctaTo: "#pricing",
    highlighted: false,
    features: [
      "Unlimited reps across regions",
      "Everything in Growth",
      "Country Manager dashboard",
      "Multi-tenant management",
      "Doctor & pharmacy portal access",
      "CME and incentive tracking",
      "Custom integrations & API",
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
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#16a34a] font-bold text-sm tracking-widest uppercase mb-3">
            Pricing
          </p>
          <h2 className="font-black text-3xl md:text-4xl text-[#1a1a1a] tracking-tight leading-tight">
            Simple plans for every team size
          </h2>
          <p className="text-gray-500 text-lg mt-4 leading-relaxed">
            Pay per rep seat. No setup fees. Cancel any time. Pricing is tailored to Uganda and East Africa — not priced for Europe.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(({ name, price, priceNote, description, cta, ctaTo, highlighted, badge, features }) => (
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

              {/* Plan name */}
              <h3 className={`font-black text-xl mb-1 ${highlighted ? "text-white" : "text-[#1a1a1a]"}`}>
                {name}
              </h3>

              {/* Price */}
              <div className="mb-1">
                <span className={`font-black text-3xl ${highlighted ? "text-white" : "text-[#16a34a]"}`}>
                  {price}
                </span>
              </div>
              <p className={`text-sm font-medium mb-4 ${highlighted ? "text-white/70" : "text-gray-400"}`}>
                {priceNote}
              </p>

              {/* Description */}
              <p className={`text-[14px] leading-relaxed mb-6 ${highlighted ? "text-white/80" : "text-gray-500"}`}>
                {description}
              </p>

              {/* CTA */}
              <Link
                to={ctaTo}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-[15px] mb-7 focus-visible:outline focus-visible:outline-2 transition-colors ${
                  highlighted
                    ? "bg-white text-[#16a34a] hover:bg-[#f0fdf4] active:bg-[#dcfce7] focus-visible:outline-white"
                    : "bg-[#16a34a] text-white hover:bg-[#15803d] active:bg-[#166534] focus-visible:outline-[#16a34a] shadow-sm shadow-green-700/20"
                }`}
              >
                {cta}
                <MdKeyboardArrowRight className="w-5 h-5" />
              </Link>

              {/* Feature list */}
              <div className="flex flex-col gap-3 mt-auto">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      highlighted ? "bg-white/20" : "bg-[#dcfce7]"
                    }`}>
                      <BiCheck className={`w-3.5 h-3.5 ${highlighted ? "text-white" : "text-[#16a34a]"}`} />
                    </div>
                    <p className={`text-sm leading-snug ${highlighted ? "text-white/90" : "text-gray-600"}`}>
                      {f}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-400 text-sm mt-10">
          All plans include the verified Uganda HCP database. Volume discounts available for 50+ reps.{" "}
          <a href="mailto:support@kibagrep.com" className="text-[#16a34a] font-semibold hover:underline">
            Contact us
          </a>{" "}
          for a custom quote.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
