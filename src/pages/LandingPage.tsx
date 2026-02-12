import HeroSection from "../components/HeroSection";
import StatsBar from "../components/StatsBar";
import BestSellers from "../components/BestSellers";
import NowAvailable from "../components/NowAvailable";
import ReviewSection from "../components/ReviewSection";
import Footer from "../components/Footer";

export default function LandingPage() {
    return (
        <main className="w-full">
            <HeroSection />
            <StatsBar />
            <BestSellers />
            <NowAvailable />
            <ReviewSection />
            <Footer />
        </main>
    );
}
