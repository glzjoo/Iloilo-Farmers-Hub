interface SelfieCaptureSectionProps {
  selfiePreview: string | null;
  onOpenCamera: () => void;
  onRetake: () => void;
}

export default function SelfieCaptureSection({ selfiePreview, onOpenCamera, onRetake }: SelfieCaptureSectionProps) {
  if (selfiePreview) {
    return (
      <div>
        <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
          Live Selfie <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <img src={selfiePreview} alt="Captured selfie" className="w-full h-64 object-cover rounded-lg" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-2 bg-white text-gray-800 rounded-full font-primary font-medium hover:bg-gray-100 transition-colors shadow-lg"
            >
              Retake Selfie
            </button>
          </div>
          <p className="absolute top-4 left-0 right-0 text-center text-white text-sm bg-green-600 bg-opacity-90 py-1">
            ✓ Selfie captured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
        Live Selfie <span className="text-red-500">*</span>
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="font-primary text-sm">Real-time camera capture required</p>
          <p className="text-xs text-gray-400 mt-1">Photo uploads not allowed for security</p>
        </div>
        <button
          type="button"
          onClick={onOpenCamera}
          className="px-6 py-2 bg-primary text-white rounded-full font-primary font-medium hover:bg-green-700 transition-colors"
        >
          Open Camera
        </button>
      </div>
    </div>
  );
}