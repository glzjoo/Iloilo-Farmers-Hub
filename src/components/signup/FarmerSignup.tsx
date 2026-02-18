import logo from '../../assets/icons/logo.png';
import { Link } from 'react-router-dom';
import SignupToggle from './SignupToggle';

export default function FarmerSignup() {

    return (
        <section className="flex items-center justify-center py-16 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <img src={logo} className="w-11 h-11 rounded-full object-cover" />
                        <span className="font-primary font-bold text-2xl">Farmer's Information</span>
                    </div>
                    <SignupToggle />
                </div>

                {/* Form — two column grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">First name</label>
                        <input
                            type="text"
                            placeholder="Enter your first name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Last name</label>
                        <input
                            type="text"
                            placeholder="Enter your last name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Name</label>
                        <input
                            type="text"
                            placeholder="Enter your farm name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Address</label>
                        <input
                            type="text"
                            placeholder="Enter your farm address"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Contact Number</label>
                        <input
                            type="text"
                            placeholder="Enter your contact number"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm type</label>
                        <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary bg-white cursor-pointer">
                            <option value="Rice">Rice</option>
                            <option value="Corn">Corn</option>
                            <option value="Vegetables">Vegetables</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Livestock">Livestock</option>
                            <option value="Poultry">Poultry</option>
                            <option value="Fishery">Fishery</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex justify-end mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" />
                        <span className="text-sm font-primary text-primary font-medium underline">I agree to Terms & Conditions</span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between mt-8">
                    <Link to="/" className="no-underline">
                        <button className="px-12 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-primary font-bold bg-white cursor-pointer hover:bg-gray-50 text-lg">
                            Clear All
                        </button>
                    </Link>
                    <button className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 text-lg">
                        Create Account
                    </button>
                </div>
            </div>
        </section>
    );
}