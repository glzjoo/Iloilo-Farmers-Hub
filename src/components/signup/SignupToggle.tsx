import { useNavigate, useLocation } from 'react-router-dom';

export default function SignupToggle() {
    const navigate = useNavigate();
    const location = useLocation();
    const isFarmer = location.pathname === '/farmer-signup';

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex rounded-full bg-gray-800 p-1">
                <div
                    className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-in-out"
                    style={{
                        width: 'calc(50% - 4px)',
                        transform: isFarmer ? 'translateX(0)' : 'translateX(100%)',
                        left: '4px',
                    }}
                />

                <button
                    onClick={() => navigate('/farmer-signup')}
                    className={`relative z-10 w-24 py-1.5 text-sm font-primary font-semibold border-none cursor-pointer rounded-full transition-colors duration-300 bg-transparent text-center ${isFarmer ? 'text-white' : 'text-gray-300 hover:text-white'
                        }`}
                >
                    Farmer
                </button>
                <button
                    onClick={() => navigate('/consumer-signup')}
                    className={`relative z-10 w-24 py-1.5 text-sm font-primary font-semibold border-none cursor-pointer rounded-full transition-colors duration-300 bg-transparent text-center ${!isFarmer ? 'text-white' : 'text-gray-300 hover:text-white'
                        }`}
                >
                    Consumer
                </button>
            </div>
        </div>
    );
}
