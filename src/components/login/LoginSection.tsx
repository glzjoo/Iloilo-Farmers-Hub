import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/icons/logo.png';

export default function LoginSection() {
    const navigate = useNavigate();

    return (
        <section className="flex items-center justify-center py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <img src={logo} className="w-11 h-11 rounded-full object-cover" />
                    <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1"> Mobile Number</label>
                        <input
                            type=" mobile number"
                            placeholder="Enter your mobile number "
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/otp')}
                        className="w-full bg-primary text-white font-primary font-semibold py-2.5 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2"
                    >
                        Login
                    </button>

                    <p className="text-sm font-primary text-center text-gray-600 mt-2">
                        Don't have an account?{" "}
                        <Link to="/farmer-signup" className="text-primary font-semibold no-underline hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
