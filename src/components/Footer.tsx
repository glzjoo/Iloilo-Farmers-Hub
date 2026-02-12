import logo from '../assets/icons/logo.png';

const description = [
    {
        title: 'Shop',
        description: ['Fresh goods', 'Rice & Grains', 'Livestock', 'Seafood', 'Processed Goods'],
    },
    {
        title: 'About IFH',
        description: ['About Us', 'Meet the Team', 'Partner with Us', 'Become a Seller', 'News and Events'],
    },
    {
        title: 'Contacts',
        description: ['Contact Us', 'FAQ', 'Terms and Conditions', 'Privacy Policy'],
    },
]
export default function Footer() {
    return (
        <footer className="w-full bg-primary text-white py-10">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-around gap-15">
                <div className="max-w-sm ">
                    <img src={logo} className="w-20 h-20 mb-4 mx-auto" />
                    <h2 className=" font-primary text-center text-xl font-bold text-white mb-2">ILOILO FARMERS HUB</h2>
                    <p className="text-justify text-sm text-white/80 leading-relaxed">Connects local farmers and consumers through a simple online marketplace. Farmers can showcase and sell their fresh produce directly, while buyers enjoy easy access to local goods at fair prices.</p>
                </div>

                {/*Link Columns */}
                <div className="flex gap-16">
                    {description.map((stat, i) => (
                        <div key={i}>
                            <h3 className="text-lg font-bold text-white mb-3">{stat.title}</h3>
                            <div className="space-y-1">
                                {stat.description.map((item, j) => (
                                    <p key={j} className="text-sm text-white/80">{item}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}