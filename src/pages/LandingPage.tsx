import HeroSection from "../components/home/HeroSection";
import StatsBar from "../components/layout/StatsBar";
import BestSellers from "../components/home/BestSellers";
import NowAvailable from "../components/home/NowAvailable";
import ReviewSection from "../components/reviews/ReviewSection";

export default function LandingPage() {
    return (
        <main className="w-full">
            <HeroSection />
            <StatsBar />
            
            {/* BestSellers with bottom margin */}
            <div className="mt-5 mb-5">
                <BestSellers />
            </div>
            
            {/* NowAvailable with top margin for extra space */}
            <div className="mt-5">
                <NowAvailable />
            </div>
            
            <ReviewSection />
        </main>
    );
}