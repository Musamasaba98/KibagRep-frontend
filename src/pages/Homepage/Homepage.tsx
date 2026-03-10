import Navbar from "../../componets/Navbar";
import HeroSection from "../../componets/HeroSection";
import SocialProof from "../../componets/SocialProof";
import Features from "../../componets/Features/Features";
import AboutBanner from "../../componets/AboutBanner";
import Highlights from "../../componets/Highlights";
import Pricing from "../../componets/Pricing";
import RequestDemo from "../../componets/RequestDemo";
import Footer from "../../componets/Footer";
import StickyBar from "../../componets/StickyBar";

const Homepage = () => {
  return (
    <div className="w-full">
      <Navbar />
      <HeroSection />
      <SocialProof />
      <Features />
      <AboutBanner />
      <Highlights />
      <Pricing />
      <RequestDemo />
      <Footer />
      <StickyBar />
    </div>
  );
};

export default Homepage;
