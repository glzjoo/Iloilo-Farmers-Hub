import okra from "../assets/images/item-pictures/okra.png";
import { useState } from "react";

interface CartItemProps {
    name: string;
    pricePerKg: number;
    price: number;
    farm: string;
    image: string;
}

export default function CartItem({ name, pricePerKg, price, farm, image }: CartItemProps) {
    const [quantity, setQuantity] = useState(1);

    return (
        <div className="flex items-center gap-6 py-6 border-b border-gray-200">
            <img src={image} alt={name} className="w-28 h-28 object-cover rounded-lg flex-shrink-0" />

            <div className="flex-1">
                <div className="flex items-baseline gap-4 mb-1">
                    <h3 className="text-2xl font-primary font-semibold text-black">{name}</h3>
                    <span className="text-lg font-primary text-gray-500">(P{pricePerKg} per Kg)</span>
                </div>
                <p className="text-sm font-primary text-gray-500 mb-2">
                    Farm: <span className="text-black underline">{farm}</span>
                </p>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-primary text-gray-500">Quantity:</span>
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100"
                    >−</button>
                    <span className="text-lg font-primary font-semibold w-6 text-center">{quantity}</span>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100"
                    >+</button>
                </div>
            </div>

            <p className="text-2xl font-primary font-bold text-primary flex-shrink-0">
                ₱{(price * quantity).toFixed(2)}
            </p>

            <div className="flex flex-col gap-2 flex-shrink-0">
                <button className="px-4 py-1.5 bg-red-600 text-white text-sm font-primary font-medium rounded-full cursor-pointer border-none hover:bg-red-700">
                    Remove
                </button>
                <button className="px-4 py-1.5 bg-primary text-white text-sm font-primary font-medium rounded-full cursor-pointer border-none hover:bg-green-700">
                    Message Seller
                </button>
            </div>
        </div>
    );
}
