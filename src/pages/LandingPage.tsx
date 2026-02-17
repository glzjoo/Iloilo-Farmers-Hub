import HeroSection from "../components/home/HeroSection";
import StatsBar from "../components/layout/StatsBar";
import BestSellers from "../components/home/BestSellers";
import NowAvailable from "../components/home/NowAvailable";
import ReviewSection from "../components/shop/ReviewSection";

export default function LandingPage() {
    return (
        <main className="w-full">
            <HeroSection />
            <StatsBar />
            <BestSellers />
            <NowAvailable />
            <ReviewSection />
        </main>
    );
}
