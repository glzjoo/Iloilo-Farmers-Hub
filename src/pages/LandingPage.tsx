import HeroSection from "../components/home/HeroSection";
import StatsBar from "../components/layout/StatsBar";
import BestSellers from "../components/home/BestSellers";
import NowAvailable from "../components/home/NowAvailable";
import SellersNearYou from "../components/home/SellersNearYou";

export default function LandingPage() {
    return (
        <main className="w-full">
            <HeroSection />
            <StatsBar />
            <SellersNearYou />

            {/* BestSellers with bottom margin */}
            <div className="mt-5 mb-5">
                <BestSellers />
            </div>

            {/* NowAvailable with top margin for extra space */}
            <div className="mt-5 mb-5">
                <NowAvailable />
            </div>
        </main>
    );
}