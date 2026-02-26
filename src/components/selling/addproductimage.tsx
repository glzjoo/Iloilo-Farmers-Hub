import { useRef, useState } from "react";
import addImage from "../../assets/icons/add-image.svg";
import selectImageUpload from "../../assets/icons/select-image-upload.svg";

interface AddProductImageProps {
    initialImage?: string;
}

export default function AddProductImage({ initialImage }: AddProductImageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(initialImage || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full">
                {/* Image preview */}
                <div className="w-full border border-gray-300 rounded-lg bg-gray-300 flex items-center justify-center h-[250px] overflow-hidden">
                    {preview ? (
                        <img src={preview} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <img src={addImage} className="w-12 h-12 opacity-40" />
                    )}
                </div>

                {/* Select/Change image button */}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-md text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <img src={selectImageUpload} alt="" className="w-4 h-4" />
                        {preview ? "Change Image" : "Select Image"}
                    </button>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Max Size: 5 MB</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    );
}