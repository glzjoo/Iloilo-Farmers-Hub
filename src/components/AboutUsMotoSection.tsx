

export default function AboutUsMotoSection() {
    return (
        <section className="w-full min-h-[600px] relative">
            <h1 className="text-5xl text-center font-primary font-semibold text-primary pt-10 pb-11">About Us</h1>
            <div className="flex justify-center gap-10 px-10">
                <div className="max-w-xl">
                    <h2 className="text-4xl text-center font-primary font-semibold text-primary mb-10">What We Do</h2>
                    <p className="text-xl font-primary text-primary text-justify">A digital platform designed to connect local farmers in Iloilo
                        directly with consumers through a convenient and reliable online marketplace. Our Mission is to empower local farmers by providing a digital marketplace that promotes fair pricing,
                        direct communication with consumers, and sustainable agricultural trade in Iloilo.</p>
                </div>
                {/* Center divider line */}
                <div className="w-0.5 bg-black self-stretch"></div>

                <div className="max-w-xl">
                    <h2 className="text-4xl text-center font-primary font-semibold text-primary mb-10">How We Operate</h2>
                    <p className="text-xl font-primary text-primary text-justify">Iloilo Farmers Hub operates
                        as a digital marketplace where local farmers list their products and manage pricing in real time.
                        Consumers can browse available products and communicate directly with farmers through the platform to
                        coordinate orders and transactions. Focuses on user management and communication to support efficient
                        and transparent agricultural trade.</p>
                </div>
            </div>
        </section >
    );
}