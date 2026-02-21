import { useState } from 'react'
import minus from '../../assets/icons/minus.svg'
import add from '../../assets/icons/add.svg'
import tomatoes from '../../assets/images/tomatoes.png'
import eggplant from '../../assets/images/eggplant.png'
import mangoes from '../../assets/images/mangoes.png'
import onions from '../../assets/images/onions.png'
import carrots from '../../assets/images/carrots.png'
import watermelon from '../../assets/images/watermelon.png'

const shopAll = [
    {
        name: 'Tomatoes',
        price: '₱ 120.00',
        image: tomatoes,
    },
    {
        name: 'Eggplant',
        price: '₱ 120.00',
        image: eggplant,
    },
    {
        name: 'Mangoes',
        price: '₱ 120.00',
        image: mangoes,
    },
    {
        name: 'Onions',
        price: '₱ 120.00',
        image: onions,
    },
    {
        name: 'Carrots',
        price: '₱ 120.00',
        image: carrots,
    },
    {
        name: 'Watermelon',
        price: '₱ 120.00',
        image: watermelon,
    },
];

interface ShopAllProps {
    searchQuery?: string;
}

export default function ShopAll({ searchQuery = '' }: ShopAllProps) {
    const [counts, setCounts] = useState<number[]>(shopAll.map(() => 1));

    const filteredProducts = searchQuery
        ? shopAll.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : shopAll;

    const handleIncrement = (index: number) => {
        setCounts(prev => prev.map((c, i) => i === index ? c + 1 : c));
    };

    const handleDecrement = (index: number) => {
        setCounts(prev => prev.map((c, i) => i === index && c > 1 ? c - 1 : c));
    };

    return (
        <section className="w-full py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-xl font-primary text-gray-400">No products found for "{searchQuery}"</p>
                        <p className="text-sm font-primary text-gray-400 mt-2">Try a different search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {filteredProducts.map((product, i) => {
                            const originalIndex = shopAll.indexOf(product);
                            return (
                                <div key={i}>
                                    <img src={product.image} className="w-full h-32 object-cover rounded-lg" />
                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                                            <p className="text-primary text-xs font-semibold pb-5">{product.price}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="bg-transparent border-none cursor-pointer p-0" onClick={() => handleDecrement(originalIndex)}>
                                                <img src={minus} alt="Decrease" className="w-7 h-7" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-900 w-5 text-center">{counts[originalIndex]}</span>
                                            <button className="bg-transparent border-none cursor-pointer p-0" onClick={() => handleIncrement(originalIndex)}>
                                                <img src={add} alt="Increase" className="w-7 h-7" />
                                            </button>
                                        </div>
                                    </div>
                                    <button className="w-full bg-primary flex items-center justify-center gap-5 text-white text-sm font-medium px-4 py-2 rounded-2xl border-none cursor-pointer mb-5">
                                        Add to Cart
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
