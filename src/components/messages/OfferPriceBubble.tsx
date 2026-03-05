
interface OfferPriceBubbleProps {
    offerPrice: number;
    isSender: boolean;
}

export default function OfferPriceBubble({ offerPrice, isSender }: OfferPriceBubbleProps) {
    return (
        <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} my-2`}>
            <div className="bg-primary text-white rounded-xl px-5 py-3 max-w-[200px] shadow-md">
                <p className="text-xs font-medium opacity-90">Made An Offer</p>
                <p className="text-lg font-bold">PHP {offerPrice.toFixed(2)}</p>
            </div>
        </div>
    );
}