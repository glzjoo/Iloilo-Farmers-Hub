import checkIcon from '../../assets/icons/Check.svg';

const plans = [
    {
        title: 'Starter',
        description: 'Perfect for small-scale farmers starting their online journey',
        price: '199',
        button: 'Start free trial',
        features: [
            'List up to 15 products',
            'Your own online storefront',
            'Basic sales analytics',
            'Product photo gallery',
        ],
    },
    {
        title: 'Grower',
        description: 'Best for active sellers with diverse produce.',
        price: '399',
        button: 'Start free trial',
        features: [
            'List up to 50 products',
            'Featured store placement',
            'Advanced sales analytics',
            'Priority customer visibility',
            'Priority support',
            'Inventory management tools',
            'Promotional campaigns',
        ],
    },
    {
        title: 'Professional',
        description: 'For established and cooperatives.',
        price: '799',
        button: 'Start free trial',
        features: [
            'Unlimited product listings',
            'Premium store placement',
            'Complete business analytics',
            'Top search visibility',
            'Multi-user accounts',
            'Custom promotions & discounts',
        ],
    },
];

export default function SellerPlan() {
    return (
        <section className="w-full py-16 px-10">
            <div className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl text-center font-primary font-bold text-black mb-2">Choose Your Seller Plan</h1>
                <p className="text-lg text-center font-primary text-gray-600">Flexible pricing for farmers of all sizes. Start selling with a 30-day free trial.</p>
            </div>

            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                {plans.map((plan, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-6 p-6 border border-gray-200 border-l-4 border-l-primary rounded-2xl"
                    >
                        {/* Title, description, price */}
                        <div className="w-[200px] flex-shrink-0">
                            <h2 className="text-xl font-primary font-bold text-black mb-1">{plan.title}</h2>
                            <p className="text-sm font-primary text-gray-600 mb-4">{plan.description}</p>
                            <p className="text-2xl font-primary font-bold text-black">
                                ₱{plan.price}<span className="text-base font-normal text-gray-600">/month</span>
                            </p>
                        </div>

                        {/* Features in two columns */}
                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <img src={checkIcon} alt="check" className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-primary text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/*Button */}
                        <div className="flex items-center self-center">
                            <button className="bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-md cursor-pointer border-none whitespace-nowrap">
                                {plan.button}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-sm text-center font-primary text-gray-500 mt-8">
                All plans include a 30-day free trial. No credit card required. Cancel anytime.
            </p>
        </section>
    );
}
