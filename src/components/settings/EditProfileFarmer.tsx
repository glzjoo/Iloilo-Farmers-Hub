import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import save from '../../assets/icons/save.png';
import cameraIcon from '../../assets/icons/camera.png';
import uploadIcon from '../../assets/icons/select-image-upload.svg';

interface FarmerProfile {
    firstName: string;
    lastName: string;
    farmName: string;
    farmAddress: string;
    phoneNo: string;
    farmType: string;
    email: string | null;
    profileImage?: string;
    bio?: string;
    verificationStatus?: string;
    verificationData?: {
        extractedFullName?: string;
        dateOfBirth?: string;
        verifiedAt?: any;
    };
    createdAt?: any;
}

export default function EditProfileFarmer() {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [farmName, setFarmName] = useState('');
    const [farmAddress, setFarmAddress] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user) { setLoading(false); return; }
        try {
            const farmerDoc = await getDoc(doc(db, 'farmers', user.uid));
            if (farmerDoc.exists()) {
                const data = farmerDoc.data() as FarmerProfile;
                setProfile(data);
                setFirstName(data.firstName || '');
                setLastName(data.lastName || '');
                setFarmName(data.farmName || '');
                setFarmAddress(data.farmAddress || '');
                setBio(data.bio || '');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        setSelectedFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let profileImageUrl = profile?.profileImage || '';

            // Upload new image if selected
            if (selectedFile) {
                setUploading(true);
                const imageRef = ref(storage, `profileImages/${user.uid}/${Date.now()}_${selectedFile.name}`);
                await uploadBytes(imageRef, selectedFile);
                profileImageUrl = await getDownloadURL(imageRef);
                setUploading(false);
            }

            await updateDoc(doc(db, 'farmers', user.uid), {
                firstName,
                lastName,
                farmName,
                farmAddress,
                bio,
                profileImage: profileImageUrl,
            });

            setProfile(prev => prev ? {
                ...prev,
                firstName, lastName, farmName, farmAddress, bio,
                profileImage: profileImageUrl,
            } : prev);
            setSelectedFile(null);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const displayImage = previewImage || profile?.profileImage || '';
    const verifiedName = profile?.verificationData?.extractedFullName || 'Not verified';
    const dateOfBirth = profile?.verificationData?.dateOfBirth || 'Not available';

    const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
    const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

    if (loading) {
        return (
            <div className="border border-gray-200 rounded-xl p-8 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-4 sm:p-8">
            <h1 className="text-xl font-bold font-primary">Edit Profile</h1>
            <p className="text-sm text-gray-400 mb-6">Only you can see this</p>
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-8 border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-5 flex-1">
                    {/* Profile Photo */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            {displayImage ? (
                                <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                                    {firstName.charAt(0)}{lastName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer border-2 border-white shadow-md hover:bg-green-700 transition-colors"
                        >
                            <img src={cameraIcon} alt="Change photo" className="w-4 h-4 brightness-0 invert" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                    </div>

                    {/* Name + Upload */}
                    <div className="pt-1">
                        <h2 className="text-lg font-bold font-primary">{farmName || 'Your Farm'}</h2>
                        <p className="text-sm text-gray-500">{firstName} {lastName}</p>
                        <p className="text-xs text-gray-400 mt-3">Upload a square Profile picture for your farm.</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <img src={uploadIcon} alt="" className="w-3.5 h-3.5" />
                            Upload Logo
                        </button>
                    </div>
                </div>

                {/* Verified Info */}
                <div className="md:border-l border-gray-200 md:pl-8 w-full md:min-w-[220px] md:w-auto">
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-800">Verified ID Name</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{verifiedName}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">Date of Birth</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{dateOfBirth}</p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                    <label className={labelClass}>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        readOnly
                        placeholder="Enter name"
                        className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500`}
                    />
                </div>
                <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        readOnly
                        placeholder="Enter name"
                        className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500`}
                    />
                </div>
                <div>
                    <label className={labelClass}>Farm Name</label>
                    <input
                        type="text"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        placeholder="Enter farm name"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Farm Location</label>
                    <input
                        type="text"
                        value={farmAddress}
                        onChange={(e) => setFarmAddress(e.target.value)}
                        placeholder="Enter location"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Store Description */}
            <div className="mt-5 mb-8">
                <label className={labelClass}>Store Description</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Describe your store..."
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    <img src={save} className="w-4 h-4" />
                    {saving ? (uploading ? 'Uploading...' : 'Saving...') : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}