import CartItem from './CartItem';
import okra from '../../assets/images/item-pictures/okra.png';

const cartItems = [
    {
        id: 1,
        name: 'Okra',
        pricePerKg: 95,
        price: 95.00,
        farm: "Bell's Produce – Iloilo",
        image: okra,
    },
    {
        id: 2,
        name: 'Okra',
        pricePerKg: 95,
        price: 95.00,
        farm: "Bell's Produce – Iloilo",
        image: okra,
    },
    {
        id: 3,
        name: 'Okra',
        pricePerKg: 95,
        price: 95.00,
        farm: "Bell's Produce – Iloilo",
        image: okra,
    },
];

export default function ItemsCheckout() {
    return (
        <section className="w-full py-12">
            <div className="max-w-5xl mx-auto px-10">
                <h2 className="text-3xl font-primary font-semibold text-primary mb-8">Your Cart</h2>

                {cartItems.map((item) => (
                    <CartItem
                        key={item.id}
                        name={item.name}
                        pricePerKg={item.pricePerKg}
                        price={item.price}
                        farm={item.farm}
                        image={item.image}
                    />
                ))}

                <div className="flex justify-center mt-10">
                    <button className="px-10 py-3 bg-primary text-white font-primary font-semibold rounded-full cursor-pointer border-none hover:bg-green-700">
                        Back to shopping
                    </button>
                </div>
            </div>
        </section>
    );
}
