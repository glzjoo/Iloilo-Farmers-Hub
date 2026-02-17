import yourStoreFront from '../../assets/icons/subscriptions-logo/your-store-front.png';
import easyOrder from '../../assets/icons/subscriptions-logo/easy-order.png';
import sellMoreEarn from '../../assets/icons/subscriptions-logo/sell-more-earn.png';
import mobileFriendly from '../../assets/icons/subscriptions-logo/mobile-friendly-dashboard.png';
import sellerSupport from '../../assets/icons/subscriptions-logo/seller-support.png';

const services = [
    {
        icon: yourStoreFront,
        title: 'Your Online Storefront',
        description: 'Get your own digital store to showcase your fresh produce with photos, descriptions, and pricing.',
    },
    {
        icon: easyOrder,
        title: 'Easy Order Management',
        description: 'Receive and manage customer orders in one place. Track sales and fulfill orders efficiently.',
    },
    {
        icon: sellMoreEarn,
        title: 'Sell More, Earn More',
        description: 'Reach customers across Iloilo and beyond. Set your own prices and keep more of your profits.',
    },
    {
        icon: mobileFriendly,
        title: 'Mobile-Friendly Dashboard',
        description: 'Manage your store from anywhere using your phone. Update inventory and respond to orders on the go.',
    },
    {
        icon: sellerSupport,
        title: 'Seller Support',
        description: 'Our team helps you succeed with training, marketing support, and customer service assistance.',
    },
];

export default function SubscriptionServices() {
    return (
        <section className="w-full py-16 px-10">
            <div className="flex flex-wrap justify-center gap-12 max-w-3xl mx-auto">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className={`w-72 p-6 h-50 border-2 border-gray-200 rounded-2xl ${index === services.length - 1 ? '' : ''}`}
                    >
                        <img src={service.icon} alt={service.title} className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-primary font-bold text-black mb-2">{service.title}</h3>
                        <p className="text-sm font-primary text-gray-600">{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
