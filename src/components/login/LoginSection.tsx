import { Link } from "react-router-dom";

export default function LoginSection() {
    return (
        <section className="flex items-center justify-center py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-primary font-bold text-primary text-center mb-6">Login</h2>
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
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password "
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <button className="w-full bg-primary text-white font-primary font-semibold py-2.5 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2">
                        Login
                    </button>

                    <p className="text-sm font-primary text-center text-gray-600 mt-2">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-primary font-semibold no-underline hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
