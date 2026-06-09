import { useEffect, useState } from "react";
import { BiCheck } from "react-icons/bi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { LuInfo } from "react-icons/lu";
import api from "../services/api";

interface PlanConfig {
  plan: string;
  display_name: string;
  price_ugx: number | null;
  show_price: boolean;
  rep_limit: number | null;
  setup_fee_ugx: number | null;
  annual_discount_pct: number;
  features: string[];
}

const PLAN_META: Record<string, {
  repRange: string;
  description: string;
  cta: string;
  ctaTo: string;
  highlighted: boolean;
  badge?: string;
}> = {
  TRIAL: {
    repRange: "30-day trial",
    description: "Full access to all features. No payment required upfront — get your team live first.",
    cta: "Start free trial",
    ctaTo: "#request-demo",
    highlighted: false,
  },
  STARTER: {
    repRange: "Up to 10 reps",
    description: "For small pharma field teams moving off Excel onto a real accountability platform.",
    cta: "Request access",
    ctaTo: "#request-demo",
    highlighted: false,
  },
  GROWTH: {
    repRange: "11 – 50 reps",
    description: "For growing teams that need supervisor approval chains, JFW coaching, and full field accountability.",
    cta: "Book a demo",
    ctaTo: "#request-demo",
    highlighted: true,
    badge: "Most popular",
  },
  ENTERPRISE: {
    repRange: "50+ reps",
    description: "For national pharma companies that need country-level visibility, multi-tenant control, and a dedicated account team.",
    cta: "Talk to us",
    ctaTo: "#request-demo",
    highlighted: false,
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-UG");
}

const Pricing = () => {
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  useEffect(() => {
    api.get("/plan/public")
      .then(r => setPlans(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const display = plans.filter(p => p.plan !== "TRIAL");

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
            Pay per rep seat. Cancel any time.
            Priced for Uganda and East Africa — not for Europe.
          </p>
        </div>

        {/* Trial callout */}
        <div className="max-w-2xl mx-auto mb-6 bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl px-6 py-4 text-center">
          <p className="text-[#15803d] font-poppins text-sm leading-relaxed">
            <span className="font-poppins-bold">Start with 30 days free — full access, no credit card.</span>{" "}
            Every new company gets a complete trial before choosing a plan. Most teams see ROI before the trial ends.
          </p>
        </div>

        {/* Setup fee notice */}
        <div className="max-w-2xl mx-auto mb-12 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 flex items-start gap-3">
          <LuInfo className="text-amber-600 mt-0.5 shrink-0" size={16} />
          <p className="text-amber-800 font-poppins text-sm leading-relaxed">
            <span className="font-poppins-bold">One-time onboarding fee applies.</span>{" "}
            Every new company goes through a structured setup: we load your doctor and pharmacy data, configure your territories and teams, and run training sessions for your reps, supervisors, and managers.
            Setup fee starts at <span className="font-poppins-bold">UGX 750,000</span> for Starter teams and{" "}
            <span className="font-poppins-bold">UGX 1,500,000</span> for Growth teams. Enterprise is scoped separately.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {(display.length > 0 ? display : FALLBACK_PLANS).map((plan) => {
            const meta = PLAN_META[plan.plan];
            if (!meta) return null;
            const { repRange, description, cta, ctaTo, highlighted, badge } = meta;

            return (
              <div
                key={plan.plan}
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
                  {plan.display_name}
                </h3>

                {/* Price */}
                {plan.show_price && plan.price_ugx ? (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className={`font-poppins-extrabold text-4xl leading-none ${highlighted ? "text-white" : "text-[#16a34a]"}`}>
                        {fmt(plan.price_ugx)}
                      </span>
                      <span className={`font-poppins-bold text-base ${highlighted ? "text-white/80" : "text-[#16a34a]"}`}>
                        UGX
                      </span>
                    </div>
                    <p className={`text-xs font-poppins mb-1 ${highlighted ? "text-white/70" : "text-gray-400"}`}>
                      per rep / month
                    </p>
                    {plan.annual_discount_pct > 0 && (
                      <p className={`text-[11px] font-poppins-semibold mb-5 ${highlighted ? "text-white/60" : "text-gray-300"}`}>
                        Save {plan.annual_discount_pct}% on annual billing — pay 10 months, get 2 free
                      </p>
                    )}
                    {plan.setup_fee_ugx && (
                      <p className={`text-[11px] font-poppins mb-5 ${highlighted ? "text-white/60" : "text-gray-400"}`}>
                        + UGX {fmt(plan.setup_fee_ugx)} one-time setup
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className={`font-poppins-extrabold text-3xl leading-none ${highlighted ? "text-white" : "text-[#16a34a]"}`}>
                        Negotiated
                      </span>
                    </div>
                    <p className={`text-xs font-poppins mb-5 ${highlighted ? "text-white/70" : "text-gray-400"}`}>
                      volume discount applied · Annual contract · custom SLA
                    </p>
                  </>
                )}

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
                  {plan.features.map((f) => (
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
            );
          })}
        </div>

        {/* Bottom notes */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 font-poppins">
          <span>✓ All plans include the verified Uganda HCP database</span>
          <span className="hidden sm:block text-gray-200">·</span>
          <span>✓ 30-day full-feature trial included</span>
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

// Static fallback while API loads (matches seeded plan configs)
const FALLBACK_PLANS: PlanConfig[] = [
  {
    plan: "STARTER", display_name: "Starter", price_ugx: 60000, show_price: true,
    rep_limit: 10, setup_fee_ugx: 750000, annual_discount_pct: 17,
    features: [
      "Up to 10 medical reps", "GPS-verified visit logging", "Call cycle management",
      "Daily report submission & approval", "Expense claims", "HCP directory access",
      "Excel report download", "Email support",
    ],
  },
  {
    plan: "GROWTH", display_name: "Growth", price_ugx: 50000, show_price: true,
    rep_limit: 50, setup_fee_ugx: 1500000, annual_discount_pct: 17,
    features: [
      "Up to 50 medical reps", "Everything in Starter", "Supervisor approval workflows",
      "Joint Field Work (JFW) scoring", "Tour plan management",
      "Pharmacy visit + stock tracking", "Field events (CME, OPD breakfasts)",
      "GPS anomaly flagging", "Priority support",
    ],
  },
  {
    plan: "ENTERPRISE", display_name: "Enterprise", price_ugx: null, show_price: false,
    rep_limit: null, setup_fee_ugx: null, annual_discount_pct: 0,
    features: [
      "Unlimited reps across regions", "Everything in Growth", "Country Manager dashboard",
      "Multi-company / multi-tenant", "Doctor & pharmacy self-service portals",
      "CME and incentive tracking", "Onboarding & data migration",
      "Dedicated account manager", "SLA-backed uptime guarantee",
    ],
  },
];

export default Pricing;
