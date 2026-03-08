import tomatoes_available from "../../assets/images/tomatoes_available.png";
import ampalaya_available from "../../assets/images/ampalaya_available.png";
import pumpkin_available from "../../assets/images/pumpkin_available.png";
import watermelon_available from "../../assets/images/watermelon_available.jpg";

const nowAvailable = [
    {
        name: 'Tomatoes',
        image: tomatoes_available,
    },
    {
        name: 'Ampalaya',
        image: ampalaya_available,
    },
    {
        name: 'Pumpkin',
        image: pumpkin_available,
    },
    {
        name: 'Watermelon',
        image: watermelon_available,
    },
];

export default function NowAvailable() {
    return (
        <section className="display flex flex-col flex-start justify-center">
            <div>
                <div className="display flex flex-wrap gap-4 justify-center">
                    {nowAvailable.map((product, i) => (
                        <div key={i} className="relative w-[300px] h-[510px] rounded-lg overflow-hidden">
                            <img src={product.image} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6 pt-16 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-sm text-white/80">Now Available</p>
                                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                                <button className="bg-white text-primary font-bold rounded-full px-6 py-2 text-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    Order now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

