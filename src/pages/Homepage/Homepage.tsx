import AboutBanner from "../../componets/AboutBanner";
import Features from "../../componets/Features/Features";
import Footer from "../../componets/Footer";
import HeroSection from "../../componets/HeroSection";
import Highlights from "../../componets/Highlights";
import Navbar from "../../componets/Navbar";
import RequestDemo from "../../componets/RequestDemo";

const Homepage = () => {
  return (
    <div className="w-full">
      {/* the navigation bar */}
      <Navbar/>
       {/* Header / Hero Section */}
      <HeroSection/>
      <Features/>
      <AboutBanner/>
      <Highlights/>
      <RequestDemo/>
      <Footer/>
    </div>
  );
};

export default Homepage;
