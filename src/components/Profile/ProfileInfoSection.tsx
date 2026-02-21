import { useRef, useState } from 'react';

export default function ProfileInfoSection() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoUrl(URL.createObjectURL(file));
        }
    };

    return (
        <section className="py-10 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10">

                <h2 className="font-primary font-bold text-2xl text-gray-800 mb-8">Profile Information</h2>

                {/* Profile Photo */}
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-200">
                    <div className="relative w-28 h-28 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {photoUrl ? (
                            <img src={photoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <h3 className="font-primary font-bold text-lg text-gray-800 mb-1">Profile Photo</h3>
                        <p className="text-sm font-primary text-gray-500 mb-3">Upload photo to personalize your account</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 font-primary text-sm font-medium text-gray-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                            Change photo
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>
                </div>

                {/* Info  */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">First name</label>
                        <input
                            type="text"
                            defaultValue="Bea"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Last name</label>
                        <input
                            type="text"
                            defaultValue="Trice"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Name</label>
                        <input
                            type="text"
                            defaultValue="Bell's Produce"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Address</label>
                        <input
                            type="text"
                            defaultValue="Iloilo City, Philippines"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Contact Number</label>
                        <input
                            type="text"
                            defaultValue="+639123456789"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Type</label>
                        <select
                            defaultValue="Vegetables"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary bg-white cursor-pointer"
                        >
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
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            defaultValue="bea4@gmail.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Password</label>
                        <input
                            type="password"
                            defaultValue="password123"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Save*/}
                <div className="flex justify-end mt-8">
                    <button className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 text-lg">
                        Save Changes
                    </button>
                </div>
            </div>
        </section>
    );
}
