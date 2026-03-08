import okra from '../assets/images/item-pictures/okra.png';
import ReviewFarmerDetails from '../components/reviews/ReviewFarmerdetails';
import samplephotofarmer from '../assets/images/sample-photo-farmer.jpg';

export default function ReviewFarmer() {
    return (
        <div className="w-full py-10 px-4 md:px-10 font-primary bg-white flex justify-center">
            <section className="w-full max-w-[1268px] border border-[#D9D9D9] rounded-[15px] p-8 md:p-12 mb-6 bg-white overflow-hidden shadow-sm shadow-gray-100">

                <div className="flex flex-col gap-6 w-full px-2">
                    {/* Profile */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#187A38] rounded-full flex items-center justify-center">
                            <img src={samplephotofarmer} className="w-14 h-14 rounded-full object-cover" />
                        </div>
                        <div className="flex flex-col pt-1">
                            <span className="font-bold text-lg text-black leading-tight">Rey Andrada</span>
                            <span className="text-sm text-gray-600 mt-1">Iloilo City</span>
                        </div>
                    </div>
                    {/* Product Selection */}
                    <div className="flex items-center gap-4">
                        <img src={okra} className="w-14 h-14 bg-gray-200 rounded-lg object-cover" alt="Okra" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-black leading-tight">Okra</span>
                            <span className="text-sm text-black mt-1">
                                <span className="text-[#187A38] font-bold">₱ 65.00</span> per kilo
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-[#D9D9D9] mt-8 mb-6"></div>
                {/* Rating and Reviews Form */}
                <ReviewFarmerDetails />

            </section>
        </div>
    );
}