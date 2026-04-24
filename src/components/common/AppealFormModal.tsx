import { useState, useRef } from 'react';
import { uploadAppealMedia, submitAppeal } from '../../services/appealService';

interface AppealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  suspensionType: string;
  onSubmitted: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function AppealFormModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  suspensionType,
  onSubmitted,
}: AppealFormModalProps) {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = [];

    for (const file of selected) {
      if (files.length + newFiles.length >= 5) break;

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) continue;

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) continue;

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    }

    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please explain why you believe this suspension is a mistake.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(new Array(files.length).fill(0));

    try {
      const mediaUrls: { url: string; type: 'image' | 'video' }[] = [];

      for (let i = 0; i < files.length; i++) {
        const result = await uploadAppealMedia(files[i].file, userId, (progress) => {
          setUploadProgress((prev) => {
            const newProgress = [...prev];
            newProgress[i] = progress;
            return newProgress;
          });
        });
        mediaUrls.push(result);
      }

      await submitAppeal({
        userId,
        userName,
        userEmail,
        suspensionType,
        reason: reason.trim(),
        mediaUrls,
      });

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Submit an Appeal</h2>
          <p className="text-sm text-gray-500 mt-1">
            Explain why you believe this suspension was issued in error. Attach images or videos as evidence.
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you believe this suspension is a mistake..."
              className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{reason.length}/2000</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Evidence <span className="text-gray-400 font-normal">(optional, max 5 files)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-green-50/30 transition-colors"
            >
              <svg
                className="w-8 h-8 mx-auto text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-500">Click to upload images or videos</p>
              <p className="text-xs text-gray-400 mt-1">Images up to 10MB, videos up to 50MB</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Previews */}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                  >
                    {file.type === 'video' ? (
                      <video src={file.preview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={file.preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ×
                    </button>
                    {uploading && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadProgress[idx] || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !reason.trim()}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Submitting...' : 'Submit Appeal'}
          </button>
        </div>
      </div>
    </div>
  );
}