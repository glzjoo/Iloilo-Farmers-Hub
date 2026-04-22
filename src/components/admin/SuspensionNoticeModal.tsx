import { useState, useEffect } from 'react';

interface SuspensionModalProps {
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent';
    suspendedUntil?: Date | null;
    onClose: () => void;
}

//what consumers users can see hehe
export default function SuspensionModal({ type, suspendedUntil, onClose }: SuspensionModalProps) {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (type === 'permanent' || type === 'warning' || !suspendedUntil) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = suspendedUntil.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown('Suspension has expired');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            setCountdown(`${days} days, ${hours} hours remaining`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [type, suspendedUntil]);

    const getConfig = () => {
        switch (type) {
            case 'warning':
                return {
                    headerBg: 'bg-yellow-500',
                    icon: '⚠',
                    title: 'Account Warning',
                    description: (
                        <p className="text-gray-800 text-sm text-center leading-relaxed">
                            Your account has received a <strong className="text-yellow-600">first warning</strong> due to a reported violation of our community guidelines.
                        </p>
                    ),
                    notice: (
                        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                            <p className="text-yellow-700 text-xs text-center font-medium">
                                Further violations may result in temporary or permanent suspension of your account.
                            </p>
                        </div>
                    ),
                    buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
                };
            case '1 week suspension':
                return {
                    headerBg: 'bg-orange-500',
                    icon: '🚫',
                    title: 'Account Suspended — 1 Week',
                    description: (
                        <p className="text-gray-800 text-sm text-center leading-relaxed">
                            Your account has been <strong className="text-orange-600">suspended for 1 week</strong> due to a reported violation.
                        </p>
                    ),
                    notice: null,
                    buttonClass: 'bg-orange-500 hover:bg-orange-600',
                };
            case '30 days suspension':
                return {
                    headerBg: 'bg-red-500',
                    icon: '🚫',
                    title: 'Account Suspended — 30 Days',
                    description: (
                        <p className="text-gray-800 text-sm text-center leading -relaxed">
                            Your account has been <strong className="text-red-600">suspended for 30 days</strong> due to repeated violations.
                        </p>
                    ),
                    notice: null,
                    buttonClass: 'bg-red-500 hover:bg-red-600',
                };
            case 'permanent':
                return {
                    headerBg: 'bg-red-600',
                    icon: '⛔',
                    title: 'Account Banned',
                    description: (
                        <p className="text-gray-800 text-sm text-center leading-relaxed">
                            Your account has been <strong className="text-red-600">permanently banned</strong> due to violations of our community guidelines.
                        </p>
                    ),
                    notice: (
                        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
                            <p className="text-red-700 text-xs text-center font-medium">
                                This action cannot be reversed. You will not be able to access your account or any of its data.
                            </p>
                        </div>
                    ),
                    buttonClass: 'bg-red-600 hover:bg-red-700',
                };
        }
    };

    const config = getConfig();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                {/* Header */}
                <div className={`px-6 py-5 text-center ${config.headerBg}`}>
                    <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
                        <span className="text-4xl">{config.icon}</span>
                    </div>
                    <h2 className="text-white text-xl font-bold">
                        {config.title}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {config.description}
                    {config.notice}

                    {/* Countdown for timed suspensions */}
                    {(type === '1 week suspension' || type === '30 days suspension') && suspendedUntil && (
                        <div className="mt-4 bg-orange-50 border border-orange-100 rounded-lg p-4 text-center">
                            <p className="text-xs text-orange-500 font-semibold mb-1">SUSPENSION ENDS</p>
                            <p className="text-lg font-bold text-orange-700">
                                {suspendedUntil.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                            {countdown && (
                                <p className="text-xs text-orange-500 mt-1">{countdown}</p>
                            )}
                        </div>
                    )}

                    <div className="mt-5 bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs text-center">
                            If you believe this is a mistake, please contact our support team for assistance.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors ${config.buttonClass}`}
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
