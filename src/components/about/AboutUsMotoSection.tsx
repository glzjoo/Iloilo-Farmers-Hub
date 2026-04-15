

export default function AboutUsMotoSection() {
    return (
        <section className="w-full min-h-fit relative pb-10 sm:pb-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-center font-primary font-semibold text-primary pt-8 sm:pt-10 pb-8 sm:pb-11 px-4">About Us</h1>
            <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-10 px-4 sm:px-10">
                <div className="max-w-xl mx-auto md:mx-0">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl text-center font-primary font-semibold text-primary mb-6 sm:mb-10">What We Do</h2>
                    <p className="text-base sm:text-lg md:text-xl font-primary text-primary text-justify">A digital platform designed to connect local farmers in Iloilo
                        directly with consumers through a convenient and reliable online marketplace. Our Mission is to empower local farmers by providing a digital marketplace that promotes fair pricing,
                        direct communication with consumers, and sustainable agricultural trade in Iloilo.</p>
                </div>
                {/* Center divider line - hidden on mobile */}
                <div className="hidden md:block w-0.5 bg-black self-stretch"></div>

                <div className="max-w-xl mx-auto md:mx-0">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl text-center font-primary font-semibold text-primary mb-6 sm:mb-10">How We Operate</h2>
                    <p className="text-base sm:text-lg md:text-xl font-primary text-primary text-justify">Iloilo Farmers Hub operates
                        as a digital marketplace where local farmers list their products and manage pricing in real time.
                        Consumers can browse available products and communicate directly with farmers through the platform to
                        coordinate orders and transactions. Focuses on user management and communication to support efficient
                        and transparent agricultural trade.</p>
                </div>
            </div>
        </section >
    );
}
