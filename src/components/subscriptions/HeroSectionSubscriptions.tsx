import subscriptionsHero from '../../assets/images/subscription-hero.png';
import arrowRightCircle from '../../assets/icons/Arrow-right-circle.svg';

export default function HeroSectionSubscriptions() {
    return (
        <section className="w-full h-[900px] relative pb-20">
            <img src={subscriptionsHero} className="w-full h-full object-cover" />
            <div className="flex flex-col justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <h1 className="text-5xl text-center font-primary font-semibold text-white">Sell Your Fresh Goods
                    Online. Reach Thousands
                    of Customers</h1>
                <p className="text-xl text-center font-primary text-white mt-10">Join Iloilo Farmers Hub and start selling your fresh produce directly to
                    consumers. No middlemen, better prices, grow your farm business</p>
                <button
                    className="flex items-center gap-2 bg-primary text-white text-lg font-medium px-8 py-3 rounded-md cursor-pointer mt-10 border-none">Start selling today
                    <img src={arrowRightCircle} alt="arrow" className="w-6 h-6" />
                </button>
            </div>
        </section >
    );
}
