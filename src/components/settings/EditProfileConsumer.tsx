import save from '../../assets/icons/save.png';

export default function EditProfileConsumer() {
    return (
        <div className="border border-gray-200 rounded-xl p-8">
            <h1 className="text-xl font-bold font-primary">Edit Profile</h1>
            <p className="text-sm text-gray-400 mb-3">Only you can see this</p>
            {/* Store Name */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-1">Store Name</label>
                <input
                    type="text"
                    placeholder="Enter store name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
            </div>

            {/* Farm Location */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-1">Farm Location</label>
                <input
                    type="text"
                    placeholder="Enter farm location"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
            </div>

            {/* Store Description */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-800 mb-1">Store Description</label>
                <textarea
                    rows={4}
                    placeholder="Describe your store..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"
                />
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