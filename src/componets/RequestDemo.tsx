import { useState } from "react";
import { icons } from "../assets/assets";
import { MdKeyboardArrowRight } from "react-icons/md";

const RequestDemo = () => {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="pricing" className="w-full bg-gray-50 py-20">
      <div className="w-[90%] 2xl:w-[70%] mx-auto">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-[#16a34a] font-bold text-sm tracking-widest uppercase mb-3">
            Get started
          </p>
          <h2 className="font-black text-3xl md:text-4xl text-[#1a1a1a] tracking-tight leading-tight">
            Ready to transform your field operations?
          </h2>
          <p className="text-gray-500 text-lg mt-4 leading-relaxed">
            Book a personalised demo and see KibagRep running on your team's territory in 20 minutes.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">

          {/* Left — image + bullets */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-8 w-full max-w-sm lg:max-w-none">
            <img
              src={icons.hero_3_img}
              alt="Demo illustration"
              className="w-full max-w-xs lg:max-w-sm h-auto object-contain"
            />
            <div className="flex flex-col gap-4 w-full">
              {[
                "Live walkthrough tailored to your territory",
                "See real call cycle enforcement in action",
                "Understand the HCP database advantage",
                "No commitment — free to start",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#16a34a] text-xs font-black">✓</span>
                  </div>
                  <p className="text-[15px] text-gray-700 font-medium leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 rounded-2xl bg-white border border-[#dcfce7] shadow-[0_4px_24px_0_rgba(22,163,74,0.08)]">
                <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
                  <span className="text-[#16a34a] text-3xl font-black">✓</span>
                </div>
                <h3 className="font-black text-[#1a1a1a] text-xl mb-2">Request received!</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  We'll reach out within 24 hours to schedule your demo.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] flex flex-col gap-4"
              >
                <h3 className="font-black text-[#1a1a1a] text-xl mb-1">Request a demo</h3>

                {[
                  { name: "name", label: "Full name", type: "text", placeholder: "Dr. Kato Brian" },
                  { name: "email", label: "Work email", type: "email", placeholder: "kato@pharma.ug" },
                  { name: "company", label: "Company / organisation", type: "text", placeholder: "Mega Lifesciences Uganda" },
                ].map(({ name, label, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Question or comment <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your team size or current challenges…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15 resize-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-[15px] py-3.5 rounded-xl shadow-sm shadow-green-700/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16a34a] transition-colors mt-1"
                >
                  Book my demo
                  <MdKeyboardArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-gray-400 mt-1">
                  No credit card required · Free to start
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestDemo;
