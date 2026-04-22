import aboutUsHero from '../../assets/images/about-us-hero.png';

export default function HeroSectionAboutUs() {
    return (
        <section className="w-full h-[300px] sm:h-[400px] md:h-[600px] relative">
            <img src={aboutUsHero} className="w-full h-full object-cover" />
            <div className="flex flex-col justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4 sm:px-8">
                <h1 className="text-2xl sm:text-3xl md:text-5xl text-center font-primary font-semibold text-white">Bringing technology closer to the fields</h1>
            </div>
        </section >
    );
}
