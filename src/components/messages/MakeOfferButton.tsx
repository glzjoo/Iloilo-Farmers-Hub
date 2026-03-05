import { useState } from 'react';
import MakeOfferModal from './MakeOfferModal';

interface MakeOfferButtonProps {
    product?: {
        name: string;
        price: number;
        unit: string;
        image: string;
    } | null;
    farmerName?: string;
    onSubmitOffer?: (offerPrice: number) => void;
}

export default function MakeOfferButton({ product, farmerName, onSubmitOffer }: MakeOfferButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubmitOffer = (offerPrice: number) => {
        if (onSubmitOffer) {
            onSubmitOffer(offerPrice);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-fit mx-auto px-8 py-2 rounded-full text-gray-700 font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    background: 'linear-gradient(180deg, rgba(220,252,231,0.7) 0%, rgba(187,247,208,0.4) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(34,197,94,0.3)',
                    boxShadow: '0 3px 12px rgba(34,197,94,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
            >
                Make Offer
            </button>

            {product && (
                <MakeOfferModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    product={product}
                    farmerName={farmerName || 'Seller'}
                    onSubmitOffer={handleSubmitOffer}
                />
            )}
        </>
    );
}