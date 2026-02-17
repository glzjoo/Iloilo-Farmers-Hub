import HeroSectionAboutUs from '../components/about/HeroSectionAboutUs';
import AboutUsMotoSection from '../components/about/AboutUsMotoSection';

export default function AboutUs() {
    return (
        <>
            <main className="w-full scroll-smooth">
                <HeroSectionAboutUs />
                <AboutUsMotoSection />
            </main>
        </>
    );
}