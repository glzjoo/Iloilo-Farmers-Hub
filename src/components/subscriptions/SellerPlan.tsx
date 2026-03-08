import checkIcon from '../../assets/icons/Check.svg';

const plans = [
    {
        title: 'Starter',
        price: '199',
        button: 'Start free trial',
        features: [
            'No Ads',
            'Unlimited Make offer',
            'Premium Badge',
        ],
    },
];

export default function SellerPlan() {
    return (
        <section className="w-full py-16 px-10">
            <div className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl text-center font-primary font-bold text-black mb-2">Choose Your Consumer Plan</h1>
                <p className="text-lg text-center font-primary text-gray-600">Start selling with a 30-day free trial.</p>
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
                            <p className="text-2xl font-primary font-bold text-black">
                                ₱{plan.price}<span className="text-base font-normal text-gray-600">/month</span>
                            </p>
                        </div>

                        {/* Features in two columns */}
                        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2"> {/* incase to add new plan*/}
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
