import tomatoes from '../../assets/images/tomatoes.png';
import eggplant from '../../assets/images/eggplant.png';
import mangoes from '../../assets/images/mangoes.png';
import filter from '../../assets/icons/Filter.svg';
import buyItem from '../../assets/icons/buy-item.svg';
import onions from '../../assets/images/onions.png';
import carrots from '../../assets/images/carrots.png';
import watermelon from '../../assets/images/watermelon.png';
import addtocart from '../../assets/icons/add-to-cart.svg'

const bestSellers = [
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


export default function BestSellers() {
    return (
        <section className="w-full py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
                    <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
                        <img src={filter} className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {bestSellers.map((product, i) => (
                        <div key={i}>
                            <img src={product.image} className="w-full h-32 object-cover rounded-lg" />
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-primary text-xs font-semibold">{product.price}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="bg-transparent border-none cursor-pointer p-0">
                                        <img src={addtocart} alt="Add to cart" className="w-7 h-7" />
                                    </button>
                                    <button className="bg-transparent border-none cursor-pointer p-0">
                                        <img src={buyItem} alt="Buy item" className="w-7 h-7" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section >
    );
}
