import { Link } from 'react-router-dom';
import farmerImage from '../../assets/images/farmer.png';

export default function HeroSection() {
    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
            <div className="relative overflow-hidden">
                <img
                    src={farmerImage}
                    className="w-full h-full object-cover min-h-[300px]"
                />
            </div>

            <div className="flex flex-col justify-center bg-gray-50 px-10 py-12 md:px-16">
                <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Iloilo City</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                    Shop Fresh.<br />Support Local.
                </h1>
                <p className="text-gray-500 text-base mb-6 max-w-md">
                    Connecting Communities Through Local Harvests.
                </p>
                <Link
                    to="/shop"
                    className="inline-block bg-green-700 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-green-800 transition-colors w-fit no-underline"
                >
                    Order now
                </Link>
            </div>
        </section>
    );
}
