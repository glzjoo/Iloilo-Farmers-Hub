
interface OfferPriceBubbleProps {
    offerPrice: number;
    isSender: boolean;
}

export default function OfferPriceBubble({ offerPrice, isSender }: OfferPriceBubbleProps) {
    return (
        <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} my-2`}>
            <div className={`rounded-xl px-5 py-3 max-w-[200px] shadow-sm ${isSender ? 'bg-primary text-white' : 'bg-[#5f6a5d] text-white'}`}>
                <p className="text-xs font-medium opacity-90">{isSender ? 'Accepted an offer' : 'Made offer'}</p>
                <p className="text-lg font-bold">PHP {offerPrice.toFixed(2)}</p>
            </div>
        </div>
    );
}