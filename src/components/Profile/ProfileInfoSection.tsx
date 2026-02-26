import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

interface FarmerProfile {
  firstName: string;
  lastName: string;
  farmName: string;
  farmAddress: string;
  phoneNo: string;
  farmType: string;
  email: string | null;
  profileImage?: string;
  lastPhotoChange?: any;
  verificationStatus?: string;
  verificationData?: {
    extractedFullName?: string;
    verifiedAt?: any;
  };
}

export default function ProfileInfoSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPhotoConfirmModal, setShowPhotoConfirmModal] = useState(false);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [canChangePhoto, setCanChangePhoto] = useState(true);
  const [timeUntilNextChange, setTimeUntilNextChange] = useState<string>('');
  
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const farmerDoc = await getDoc(doc(db, 'farmers', user.uid));
      if (farmerDoc.exists()) {
        const data = farmerDoc.data() as FarmerProfile;
        setProfile(data);
        setEditedProfile(data);
        if (data.profileImage) {
          setPhotoUrl(data.profileImage);
        }
        
        checkPhotoChangeCooldown(data.lastPhotoChange);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkPhotoChangeCooldown = (lastChange: any) => {
    if (!lastChange) {
      setCanChangePhoto(true);
      return;
    }

    const lastChangeDate = lastChange.toDate ? lastChange.toDate() : new Date(lastChange);
    const oneWeekLater = new Date(lastChangeDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now < oneWeekLater) {
      setCanChangePhoto(false);
      const diff = oneWeekLater.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeUntilNextChange(`${days}d ${hours}h`);
    } else {
      setCanChangePhoto(true);
    }
  };

  const handleInputChange = (field: keyof FarmerProfile, value: string) => {
    if (!editedProfile) return;
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!canChangePhoto) {
      setError(`You can change your photo again in ${timeUntilNextChange}`);
      return;
    }

    setPendingPhotoFile(file);
    setPendingPhotoPreview(URL.createObjectURL(file));
    setShowPhotoConfirmModal(true);
    setError(null);
  };

  const confirmPhotoChange = async () => {
    if (!pendingPhotoFile || !user) return;

    setPhotoUploadLoading(true);
    setShowPhotoConfirmModal(false);

    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, pendingPhotoFile);
      const downloadUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'farmers', user.uid), {
        profileImage: downloadUrl,
        lastPhotoChange: serverTimestamp(),
      });

      setPhotoUrl(downloadUrl);
      setPendingPhotoFile(null);
      setPendingPhotoPreview(null);
      
      checkPhotoChangeCooldown(new Date());
      await refreshProfile();
      
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const cancelPhotoChange = () => {
    setPendingPhotoFile(null);
    setPendingPhotoPreview(null);
    setShowPhotoConfirmModal(false);
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;
    
    setSaveLoading(true);
    setError(null);

    try {
      // REMOVED: firstName and lastName from update - they are locked
      const updateData = {
        farmName: editedProfile.farmName,
        farmAddress: editedProfile.farmAddress,
        phoneNo: editedProfile.phoneNo,
        farmType: editedProfile.farmType,
        email: editedProfile.email,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'farmers', user.uid), updateData);

      // Update local state
      setProfile(editedProfile);
      setIsEditing(false);
      
      await refreshProfile();
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </section>
    );
  }

  if (error && !isEditing) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 text-center">
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 px-4">
      {/* Photo Confirmation Modal - unchanged */}
      {showPhotoConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="font-primary font-bold text-xl text-gray-800 mb-2">
              Confirm Profile Photo
            </h3>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to use this photo?
            </p>

            {pendingPhotoPreview && (
              <div className="mb-6">
                <img 
                  src={pendingPhotoPreview} 
                  alt="Preview" 
                  className="w-32 h-32 mx-auto rounded-xl object-cover border-4 border-gray-200"
                />
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Important Warning
              </p>
              <p className="text-red-600 text-xs mt-1">
                Once changed, you will <strong>NOT</strong> be able to update your profile photo again for <strong>1 week</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmPhotoChange}
                className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold hover:bg-green-700 transition-colors"
              >
                Yes, Use This Photo
              </button>
              
              <button
                onClick={cancelPhotoChange}
                className="w-full py-3 rounded-full border-2 border-gray-300 text-gray-600 font-primary font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10">

        <div className="flex items-center justify-between mb-8">
          <h2 className="font-primary font-bold text-2xl text-gray-800">Profile Information</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              profile.verificationStatus === 'verified' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {profile.verificationStatus === 'verified' ? '✓ Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Profile Photo - unchanged */}
        <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-200">
          <div className="relative w-28 h-28 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              <img src={photoUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
            {canChangePhoto && !photoUploadLoading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            )}
            {photoUploadLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-primary font-bold text-lg text-gray-800 mb-1">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-sm font-primary text-gray-500 mb-1">{profile.farmName}</p>
            <p className="text-xs font-primary text-gray-400 mb-3">
              Member since {profile.verificationData?.verifiedAt?.toDate?.().toLocaleDateString() || 'N/A'}
            </p>
            
            {canChangePhoto ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploadLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 font-primary text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Change photo
              </button>
            ) : (
              <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                Photo change available in {timeUntilNextChange}
              </p>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && isEditing && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-primary">{error}</p>
          </div>
        )}

        {/* Info Grid - NAMES LOCKED (read-only), OTHERS EDITABLE */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {/* LOCKED: First name - always read-only */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">First name</label>
            <input
              type="text"
              value={profile.firstName}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none bg-gray-50 cursor-not-allowed"
              title="Name cannot be changed - verified from ID"
            />
          </div>

          {/* LOCKED: Last name - always read-only */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Last name</label>
            <input
              type="text"
              value={profile.lastName}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none bg-gray-50 cursor-not-allowed"
              title="Name cannot be changed - verified from ID"
            />
          </div>

          {/* EDITABLE: Farm Name */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Name</label>
            <input
              type="text"
              value={editedProfile.farmName}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange('farmName', e.target.value)}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none ${
                isEditing ? 'focus:border-primary bg-white' : 'bg-gray-50'
              }`}
            />
          </div>

          {/* EDITABLE: Farm Address */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Address</label>
            <input
              type="text"
              value={editedProfile.farmAddress}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange('farmAddress', e.target.value)}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none ${
                isEditing ? 'focus:border-primary bg-white' : 'bg-gray-50'
              }`}
            />
          </div>

          {/* EDITABLE: Contact Number */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Contact Number</label>
            <input
              type="text"
              value={editedProfile.phoneNo}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange('phoneNo', e.target.value)}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none ${
                isEditing ? 'focus:border-primary bg-white' : 'bg-gray-50'
              }`}
            />
          </div>

          {/* EDITABLE: Farm Type */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Farm Type</label>
            <select
              value={editedProfile.farmType}
              disabled={!isEditing}
              onChange={(e) => handleInputChange('farmType', e.target.value)}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none bg-white cursor-pointer ${
                isEditing ? 'focus:border-primary' : 'bg-gray-50'
              }`}
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

          {/* EDITABLE: Email (Optional) */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={editedProfile.email || ''}
              readOnly={!isEditing}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="No email provided"
              className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none ${
                isEditing ? 'focus:border-primary bg-white' : 'bg-gray-50'
              }`}
            />
          </div>

          {/* LOCKED: Verified ID Name - always read-only */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">Verified ID Name</label>
            <input
              type="text"
              value={profile.verificationData?.extractedFullName || 'N/A'}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none bg-gray-50 cursor-not-allowed"
              title="Verified from government ID"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-600 font-primary font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saveLoading}
                className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50"
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}