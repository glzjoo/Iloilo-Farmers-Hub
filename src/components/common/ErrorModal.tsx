// ============================================
// FILE: src/components/common/ErrorModal.tsx
// ============================================
import { useEffect } from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  buttonLabel?: string;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function ErrorModal({
  isOpen,
  title,
  message,
  buttonLabel = 'Got it',
  onClose,
  icon,
}: ErrorModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            {icon || (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-primary">
            {title}
          </h3>
          <div className="text-gray-600 font-primary text-sm leading-relaxed">
            {message}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors font-primary"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}