import { useState } from 'react';
import settingIcon from '../assets/icons/account-settings.svg';
import accountIcon from '../assets/icons/account-icon.svg';
import EditProfileFarmer from '../components/settings/EditProfileFarmer';
import SecuritySettingFarmer from '../components/settings/SecuritySettingFarmer';

export default function FarmerAccountSetting() {
    const [activeTab, setActiveTab] = useState<'edit-profile' | 'security'>('edit-profile');

    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-8 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <img src={settingIcon} alt="" className="w-8 h-8" />
                <div>
                    <h1 className="text-2xl font-bold font-primary">Settings</h1>
                    <p className="text-sm text-gray-500">Manage your account preferences and security settings</p>
                </div>
            </div>


            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar — horizontal on mobile, vertical on md+ */}
                <div className="flex flex-row md:flex-col md:w-[200px] gap-1 overflow-x-auto shrink-0 border-b md:border-b-0 pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveTab('edit-profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-semibold cursor-pointer transition-colors ${activeTab === 'edit-profile'
                            ? 'bg-primary text-white border-l-4 border-primary'
                            : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                    >
                        <img src={accountIcon} alt="" className="w-5 h-5" />
                        Edit Profile
                    </button>

                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-semibold cursor-pointer transition-colors ${activeTab === 'security'
                            ? 'bg-primary text-white border-l-4 border-primary'
                            : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Security
                    </button>
                </div>

                <div key={activeTab} className="flex-1 animate-tab-fade-in">
                    {activeTab === 'edit-profile' && <EditProfileFarmer />}
                    {activeTab === 'security' && <SecuritySettingFarmer />}
                </div>
            </div>
        </section>
    );
}