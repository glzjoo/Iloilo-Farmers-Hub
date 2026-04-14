// ============================================
// FILE: src/components/common/ConfirmationModal.tsx
// ============================================
import { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
  icon,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      button: 'bg-primary hover:bg-green-700',
    },
    success: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
  };

  const defaultIcons = {
    warning: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${variantStyles[variant].bg} rounded-full flex items-center justify-center mx-auto mb-4 ${variantStyles[variant].icon}`}>
            {icon || defaultIcons[variant]}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-primary">
            {title}
          </h3>
          <div className="text-gray-600 font-primary text-sm leading-relaxed">
            {message}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className={`w-full ${variantStyles[variant].button} text-white font-semibold py-3 rounded-xl transition-colors font-primary`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors font-primary"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}