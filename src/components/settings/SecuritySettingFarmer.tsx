import save from '../../assets/icons/save.png';

export default function SecuritySettingFarmer() {
    return (
        <div className="border border-gray-200 rounded-xl p-8">
            <h1 className="text-xl font-bold font-primary mb-4">Security</h1>

            {/* Private Details */}
            <div className="mb-6">
                <h3 className="text-base font-bold font-primary">Private details</h3>
                <p className="text-sm text-gray-400">Only you can see this</p>
            </div>

            {/* Mobile Number */}
            {/*add default value here based on the user number */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-1">Mobile Number</label>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        defaultValue="09123456789"
                        readOnly
                        className="w-[300px] border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none bg-gray-50"
                    />
                    <button className="text-primary text-sm font-semibold cursor-pointer hover:underline">
                        Update
                    </button>
                </div>
            </div>

            {/* Email */}
            {/*add default value here based on the email */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                <div className="flex items-center gap-3">
                    <input
                        type="email"
                        defaultValue="raylalejaga12@gmail.com"
                        readOnly
                        className="w-[300px] border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none bg-gray-50"
                    />
                    <button className="text-primary text-sm font-semibold cursor-pointer hover:underline">
                        Update
                    </button>
                </div>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors">
                    <img src={save} className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}