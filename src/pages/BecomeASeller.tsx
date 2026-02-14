import aboutUsHero from '../assets/images/about-us-hero.png';
import BecomeAsellerSection from '../components/BecomeAsellerSection';


export default function BecomeASeller() {
    return (
        <main className="w-full scroll-smooth">
            <section className="w-full min-h-[600px] relative">
                <img src={aboutUsHero} className="w-full h-full object-cover" />
                <div className="flex flex-col justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <h1 className="text-5xl text-center font-primary font-semibold text-white">Bringing technology closer to the fields</h1>
                </div>
            </section>
            <BecomeAsellerSection />
        </main>
    );
}
