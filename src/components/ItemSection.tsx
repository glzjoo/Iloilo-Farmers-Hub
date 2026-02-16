import { useState } from 'react';
import okra from '../assets/images/item-pictures/okra.png';
import item2 from '../assets/images/item-pictures/item-2.png';
import item3 from '../assets/images/item-pictures/item-3.png';
import item4 from '../assets/images/item-pictures/item-4.png';

const product = {
    name: 'Okra',
    pricePerKg: 95,
    price: 95.00,
    rating: 4.3,
    ratingCount: 12,
    details: 'harvested in the morning of 25/11/2025',
    farm: "Bell's Produce – Iloilo",
    images: [okra, item2, item3, item4],
};

export default function ItemSection() {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const handlePrev = () => {
        setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
    };

    return (
        <section className="w-full py-12">
            <div className="max-w-4xl mx-auto px-10 flex gap-10">
                <div className="flex flex-col items-center w-[320px] flex-shrink-0">
                    <div className="w-full h-[260px] rounded-xl overflow-hidden mb-3">
                        <img
                            src={product.images[selectedImage]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        <button
                            onClick={handlePrev}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 flex-shrink-0"
                        >
                            ‹
                        </button>
                        <div className="flex gap-2 overflow-hidden flex-1 justify-center">
                            {product.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`thumbnail ${i}`}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-14 h-14 object-cover rounded-md cursor-pointer border-2 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 flex-shrink-0"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {/* Product details */}
                <div className="flex-1">
                    <div className="flex items-baseline gap-4 mb-1">
                        <h1 className="text-3xl font-primary font-bold text-black">{product.name}</h1>
                        <span className="text-2xl font-primary text-gray-600">(P{product.pricePerKg} per Kg)</span>
                    </div>
                    <p className="text-sm font-primary text-gray-500 mb-3">
                        {product.rating} <span className="text-yellow-500">★</span> | {product.ratingCount} Ratings
                    </p>

                    <p className="text-3xl font-primary font-bold text-primary mb-4">₱{product.price.toFixed(2)}</p>

                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Details:</span>
                        <span className="text-sm font-primary font-semibold text-black">{product.details}</span>
                    </div>
                    <div className="flex gap-4 mb-2">
                        <span className="text-sm font-primary text-gray-500 w-20">Farm:</span>
                        <span className="text-sm font-primary font-semibold text-black underline">{product.farm}</span>
                    </div>
                    <div className="flex gap-4 items-center mb-6">
                        <span className="text-sm font-primary text-gray-500 w-20">Quantity:</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-lg text-gray-600 hover:bg-gray-100"
                            >
                                −
                            </button>
                            <span className="text-lg font-primary font-semibold w-8 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-lg text-gray-600 hover:bg-gray-100"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-16">
                        <button className="px-8 py-2.5 border-2 border-primary text-primary font-primary font-semibold rounded-full cursor-pointer bg-white hover:bg-green-50">
                            Add to cart
                        </button>
                        <button className="px-8 py-2.5 bg-primary text-white font-primary font-semibold rounded-full cursor-pointer border-none hover:bg-green-700">
                            Message Seller
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}