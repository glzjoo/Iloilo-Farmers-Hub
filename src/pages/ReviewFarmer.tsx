import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/messageService';
import { getProductById } from '../services/shopService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReviewFarmerDetails from '../components/reviews/ReviewFarmerdetails';
import defaultProductImage from '../assets/images/item-pictures/okra.png';
import defaultFarmerImage from '../assets/images/sample-photo-farmer.jpg';
//reviewFarmer
interface LocationState {
  productId?: string;
  farmerId?: string;
  orderId?: string;
  fromOrder?: boolean;
}

export default function ReviewFarmer() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { productId, farmerId, orderId } = (location.state as LocationState) || {};
  
  const [farmer, setFarmer] = useState<{
    name: string;
    location: string;
    image: string;
  } | null>(null);
  
  const [product, setProduct] = useState<{
    name: string;
    price: number;
    unit: string;
    image: string;
  } | null>(null);
  
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId || !farmerId) {
      const stored = sessionStorage.getItem('pendingReview');
      if (stored) {
        const parsed = JSON.parse(stored);
        navigate('/review-farmer', {
          replace: true,
          state: {
            productId: parsed.productId,
            farmerId: parsed.farmerId,
            orderId: parsed.orderId,
            fromOrder: true,
          }
        });
        return;
      } else {
        setError('Missing review information');
        setLoading(false);
        return;
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const farmerProfile = await getUserProfile(farmerId);
        if (farmerProfile) {
          setFarmer({
            name: farmerProfile.displayName,
            location: farmerProfile.farmName || 'Iloilo City',
            image: farmerProfile.avatar || defaultFarmerImage,
          });
        }

        if (productId) {
          const productData = await getProductById(productId);
          if (productData) {
            setProduct({
              name: productData.name,
              price: productData.price,
              unit: productData.unit,
              image: productData.image || defaultProductImage,
            });
          }
        }

        if (orderId) {
          const convRef = doc(db, 'conversations', orderId);
          const convSnap = await getDoc(convRef);
          if (convSnap.exists()) {
            const convData = convSnap.data();
            setAgreedPrice(convData.lastAcceptedOfferPrice || product?.price || null);
          }
        }
      } catch (err) {
        console.error('Error fetching review data:', err);
        setError('Failed to load review data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, farmerId, orderId, navigate, product?.price]);

  if (loading) {
    return (
      <div className="w-full py-10 px-4 md:px-10 font-primary bg-white flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-10 px-4 md:px-10 font-primary bg-white flex justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/messages')}
            className="px-6 py-2 bg-primary text-white rounded-lg"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = agreedPrice || product?.price || 0;

  return (
    <div className="w-full py-10 px-4 md:px-10 font-primary bg-white flex justify-center">
      <section className="w-full max-w-[1268px] border border-[#D9D9D9] rounded-[15px] p-8 md:p-12 mb-6 bg-white overflow-hidden shadow-sm shadow-gray-100">

        {/* Farmer and Product side by side */}
        <div className="flex items-center justify-between w-full px-2">
          {/* Farmer Profile - Left */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#187A38] rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={farmer?.image || defaultFarmerImage} 
                className="w-14 h-14 rounded-full object-cover" 
                alt={farmer?.name || 'Farmer'}
              />
            </div>
            <div className="flex flex-col pt-1">
              <span className="font-bold text-lg text-black leading-tight">
                {farmer?.name || 'Unknown Farmer'}
              </span>
              <span className="text-sm text-gray-600 mt-1">
                {farmer?.location || 'Iloilo City'}
              </span>
            </div>
          </div>

          {/* Product - Right */}
          <div className="flex items-center gap-4 text-right"> 
            <div className="flex flex-col items-end">
              <span className="font-semibold text-black leading-tight">
                {product?.name || 'Unknown Product'}
              </span>
              <span className="text-sm text-black mt-1">
                <span className="text-[#187A38] font-bold">
                  ₱ {displayPrice.toFixed(2)}
                </span> per {product?.unit || 'unit'}
              </span>
              {agreedPrice && agreedPrice !== product?.price && (
                <span className="text-xs text-gray-500">
                  Original: ₱{product?.price.toFixed(2)} | Agreed: ₱{agreedPrice.toFixed(2)}
                </span>
              )}
            </div>
            <img 
              src={product?.image || defaultProductImage} 
              className="w-14 h-14 bg-gray-200 rounded-lg object-cover" 
              alt={product?.name || 'Product'} 
            />
          </div>
        </div>

        <div className="w-full h-px bg-[#D9D9D9] mt-8 mb-6"></div>
        
        <ReviewFarmerDetails />

      </section>
    </div>
  );
}