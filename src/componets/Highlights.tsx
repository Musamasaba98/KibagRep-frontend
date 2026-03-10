const STATS = [
  {
    value: "10,000+",
    label: "Verified HCPs in database",
    sub: "Doctors & pharmacies across Uganda",
  },
  {
    value: "100%",
    label: "Real-time visit tracking",
    sub: "GPS-verified, no manual entry",
  },
  {
    value: "3×",
    label: "Faster report turnaround",
    sub: "vs. traditional Excel-based SFA",
  },
  {
    value: "0",
    label: "Faked visits that slip through",
    sub: "GPS cross-check on every call",
  },
];

const Highlights = () => {
  return (
    <section className="w-full bg-white py-20">
      <div className="w-[90%] 2xl:w-[70%] mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#16a34a] font-bold text-sm tracking-widest uppercase mb-3">
            By the numbers
          </p>
          <h2 className="font-black text-3xl md:text-4xl text-[#1a1a1a] tracking-tight">
            The platform that moves the needle
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map(({ value, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_32px_0_rgba(22,163,74,0.12)]"
              style={{ transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
            >
              <span className="font-black text-4xl md:text-5xl text-[#16a34a] leading-none tracking-tight">
                {value}
              </span>
              <span className="font-bold text-[#1a1a1a] text-[15px] mt-3 leading-tight">
                {label}
              </span>
              <span className="text-gray-500 text-xs mt-1.5 leading-snug">
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Highlights;
