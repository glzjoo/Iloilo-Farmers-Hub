import { Link } from 'react-router-dom';
import farmerImage from '../../assets/images/farmer.png';

export default function HeroSection() {
    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
            <div className="relative overflow-hidden">
                <img
                    src={farmerImage}
                    alt="Local farmer in Iloilo"
                    className="w-full h-full object-cover min-h-[320px]"
                />
            </div>

            <div className="flex flex-col justify-center bg-accent px-10 py-14 md:px-16 gap-4">
                {/* Eyebrow label */}
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
                    Iloilo City
                </p>

                {/* Headline — Coolvetica display face */}
                <h1 className="font-heading text-5xl md:text-6xl font-bold text-primary leading-[1.1]">
                    Shop Fresh.<br />Support Local.
                </h1>

                {/* Subheading — Inter body */}
                <p className="font-body text-neutral-500 text-base leading-relaxed max-w-sm">
                    Connecting communities through local harvests — fresh from Iloilo's finest farms.
                </p>

                {/* CTA */}
                <div className="mt-2">
                    <Link
                        to="/shop"
                        className="inline-block bg-primary text-white font-body font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-forest/90 active:scale-95 transition-all duration-200 shadow-md shadow-primary/30 no-underline"
                    >
                        Order now
                    </Link>
                </div>
            </div>
        </section>
    );
}

