import farmer from '../../assets/images/sample-photo-farmer.jpg';
//sellers near you component
interface SellerCard {
    name: string;
    farmName: string;
    location: string;
    distance: number;
    rating: number;
    image: string;
}

const sampleSellers: SellerCard[] = [
    { name: 'Rey Jane Andrada', farmName: "Rey's Fresh Farm", location: 'Oton, Iloilo', distance: 2.5, rating: 5.0, image: farmer },
    { name: 'Maria Santos', farmName: "Santos Organic Farm", location: 'Pavia, Iloilo', distance: 4.1, rating: 4.8, image: farmer },
    { name: 'Juan Dela Cruz', farmName: "Dela Cruz Harvest", location: 'Santa Barbara, Iloilo', distance: 6.3, rating: 4.5, image: farmer },
    { name: 'Ana Reyes', farmName: "Reyes Green Acres", location: 'San Miguel, Iloilo', distance: 8.0, rating: 4.9, image: farmer },
    { name: 'Pedro Garcia', farmName: "Garcia Family Farm", location: 'Leganes, Iloilo', distance: 10.2, rating: 4.2, image: farmer },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`text-sm leading-none ${star <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                >★</span>
            ))}
            <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
        </div>
    );
}

export default function SellersNearYou() {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Sellers Near You</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {sampleSellers.map((seller, idx) => (
                    <div
                        key={idx}
                        className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >

                        <div className="relative overflow-hidden">
                            <img
                                src={seller.image}
                                alt={seller.name}
                                className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Distance */}
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                                <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[11px] font-semibold text-gray-700">{seller.distance} km</span>
                            </div>
                        </div>

                        {/* Seller Info */}
                        <div className="p-3">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{seller.farmName}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{seller.name}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs text-gray-400 truncate">{seller.location}</span>
                            </div>
                            <div className="mt-2">
                                <StarRating rating={seller.rating} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}