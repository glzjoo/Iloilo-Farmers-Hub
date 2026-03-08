import { useState } from 'react';
import Camera from '../../assets/icons/camera.svg';
import Video from '../../assets/icons/video.svg';


const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
    <svg
        onClick={onClick}
        className={`w-10 h-10 cursor-pointer transition-colors ${filled ? 'text-[#187A38]' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export default function ReviewFarmerDetails() {
    const [rating, setRating] = useState(0);

    return (
        <div className="flex flex-col md:flex-row gap-12 mt-8 w-full">
            <div className="flex flex-col flex-1 pl-2">
                <p className="font-semibold text-lg text-black mb-4">Rate Farmer</p>
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                            key={star}
                            filled={rating >= star}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                {/* Add photos or video */}
                <p className="font-medium text-black mb-4">Add photos or video</p>
                <div className="flex gap-4">
                    <button className="flex-1 max-w-[140px] h-28 border border-gray-300 rounded-xl flex flex-col items-center justify-center text-[#187A38] hover:bg-green-50 transition-colors">
                        <img src={Camera} alt="" />
                        <span className="text-sm font-medium text-black">Photo</span>
                    </button>
                    <button className="flex-1 max-w-[140px] h-28 border border-gray-300 rounded-xl flex flex-col items-center justify-center text-[#187A38] hover:bg-green-50 transition-colors">
                        <img src={Video} alt="" />
                        <span className="text-sm font-medium text-black">Video</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1">
                <div className="flex justify-start mb-2">
                    <span className="text-sm text-gray-600">Write 100 characters</span>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-black">Quality:</label>
                        <textarea
                            placeholder="Type here..."
                            className="w-full h-[100px] bg-white rounded-lg p-4 resize-none outline-none text-black focus:ring-1 focus:ring-[#187A38]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-black">Appearance:</label>
                        <textarea
                            className="w-full h-[100px] bg-white rounded-lg p-4 resize-none outline-none text-black focus:ring-1 focus:ring-[#187A38]"
                        />
                    </div>
                </div>
                {/* Submit */}
                <button className="w-full h-10 bg-[#187A38] rounded-md text-white font-semibold mt-5">Submit Review</button>
            </div>
        </div>
    );
}