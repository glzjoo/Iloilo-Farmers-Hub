import { useRef } from 'react';

interface IDUploadSectionProps {
  idPreview: string | null;
  onImageSelect: (file: File) => void;
}

export default function IDUploadSection({ idPreview, onImageSelect }: IDUploadSectionProps) {
  const idInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageSelect(file);
  };

  return (
    <div>
      <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
        ID Card Photo <span className="text-red-500">*</span>
      </label>
      <div 
        onClick={() => idInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          idPreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
      >
        {idPreview ? (
          <div className="relative">
            <img src={idPreview} alt="ID Preview" className="max-h-48 mx-auto rounded shadow" />
            <p className="text-green-600 text-sm mt-2 font-primary">✓ ID uploaded</p>
            <p className="text-xs text-gray-500">Click to change</p>
          </div>
        ) : (
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
            </svg>
            <p className="font-primary text-sm">Click to upload ID card</p>
            <p className="text-xs text-gray-400 mt-1">Clear photo of front side</p>
          </div>
        )}
        <input 
          ref={idInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
}