import { useState, useRef, type ChangeEvent } from 'react';
import cameraIcon from '../../assets/icons/camera.png'; 

interface AddProductImageProps {
    initialImage?: string;
    onImageSelect?: (file: File | null) => void;
}

export default function AddProductImage({ initialImage, onImageSelect }: AddProductImageProps) {
    const [previewUrl, setPreviewUrl] = useState<string>(initialImage || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }

            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            
            // Notify parent component
            onImageSelect?.(file);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onImageSelect?.(null);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
                Product Image
            </label>
            
            <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    previewUrl ? 'border-primary bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }`}
                onClick={triggerFileInput}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                />
                
                {previewUrl ? (
                    <div className="relative">
                        <img 
                            src={previewUrl} 
                            alt="Product preview" 
                            className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage();
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="py-8">
                        <img 
                            src={cameraIcon} 
                            alt="Upload" 
                            className="w-12 h-12 mx-auto mb-3 opacity-50"
                        />
                        <p className="text-sm text-gray-500">Click to upload product image</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                    </div>
                )}
            </div>
        </div>
    );
}