import starsRating from '../assets/icons/stars-rating.svg';

const ratingBars = [
    { stars: 5, percent: 80 },
    { stars: 4, percent: 60 },
    { stars: 3, percent: 35 },
    { stars: 2, percent: 15 },
    { stars: 1, percent: 5 },
];

const reviews = [
    {
        name: 'John Doe',
        rating: 5,
        date: '2022-01-01',
        comment: 'Great product!',
    },
    {
        name: 'Jane Doe',
        rating: 4,
        date: '2022-01-02',
        comment: 'Good product!',
    },
    {
        name: 'John Doe',
        rating: 5,
        date: '2022-01-01',
        comment: 'Great product!',
    },
];

export default function ReviewSection() {
    return (
        <section className="w-full py-12">
            <div className="max-w-7xl mx-auto px-10">
                <div className="flex items-center gap-6 mb-8 border-b border-gray-300 pb-3">
                    <h2 className="text-lg font-bold text-dark cursor-pointer border-b-2 border-black pb-1">Product Reviews</h2>
                    <h2 className="text-lg font-bold text-gray-400 cursor-pointer">Store Reviews</h2>
                </div>
                <div className="flex items-start gap-16">
                    <div className="flex flex-col items-start">
                        <p className="text-6xl font-bold text-dark leading-none">4.58</p>
                        <img src={starsRating} alt="4.58 stars" className="w-28 mt-2 -ml-1" />
                        <p className="text-sm text-gray-400 mt-3">705 reviews</p>
                    </div>

                    <div className="flex-1 space-y-3 max-w-md pt-2">
                        {ratingBars.map((bar) => (
                            <div key={bar.stars} className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 w-3">{bar.stars}</span>
                                <div className="flex-1 h-[15px] rounded-full overflow-hidden" style={{ backgroundColor: '#D9D9D9' }}>
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${bar.percent}%`, backgroundColor: '#FFCB45' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Review */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                    {reviews.map((review, i) => (
                        <div key={i} className="border border-gray-200 p-6 h-[200px]" style={{ borderRadius: '40px' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-dark">{review.name}</p>
                                    <p className="text-xs text-gray-400">{review.date}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, s) => (
                                    <span key={s} className={`text-sm ${s < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                                ))}
                            </div>
                            <p className="text-sm text-gray-600">{review.comment}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section >

    );
}