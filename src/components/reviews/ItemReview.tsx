import itemReviewProfile from '../../assets/images/item-pictures/item-review-profile.jpg';
import Filter from '../../assets/icons/Filter.svg';

const reviews = [
    {
        name: 'Erick R. Reymundo',
        rating: 4.5,
        date: '26/11/2025',
        time: '8:42',
        product: 'Okra – 2kg',
        quality: 'I think its Good',
        comment: 'Mukha ok nmn sya, will comment again if masarap tapos e luto.',
        image: itemReviewProfile,
    },
];

function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars.push(<span key={i} className="text-yellow-500 text-lg">★</span>);
        } else if (i - 0.5 <= rating) {
            stars.push(<span key={i} className="text-yellow-500 text-lg">★</span>);
        } else {
            stars.push(<span key={i} className="text-gray-300 text-lg">★</span>);
        }
    }
    return <div className="flex gap-0.5">{stars}</div>;
}

export default function ItemReview() {
    return (
        <section className="w-full py-12">
            <div className="max-w-4xl mx-auto px-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-primary font-semibold text-black">Reviews</h2>
                    <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
                        <img src={Filter} className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {reviews.map((review, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <img src={review.image} alt="Reviewer" className="w-10 h-10 rounded-full object-cover" />
                                </div>
                                <h3 className="text-lg font-primary font-bold text-black">{review.name}</h3>
                            </div>
                            <div className="ml-13 pl-0.5">
                                <StarRating rating={review.rating} />
                                <p className="text-sm font-primary text-gray-600 mt-1">
                                    {review.date} &nbsp; {review.time} &nbsp; | &nbsp; {review.product}
                                </p>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-sm font-primary text-gray-400">Quality:</span>
                                    <span className="text-sm font-primary text-black">{review.quality}</span>
                                </div>
                                <p className="text-sm font-primary text-black mt-2">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
