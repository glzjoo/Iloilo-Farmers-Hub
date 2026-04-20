import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FarmerWithLocation, Product } from '../types';
import { getProducts } from '../services/shopService';

export default function FarmerShopPage() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<FarmerWithLocation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFarmerData = async () => {
      if (!farmerId) return;

      try {
        setLoading(true);
        
        // Fetch farmer data
        const farmerDoc = await getDoc(doc(db, 'farmers', farmerId));
        if (!farmerDoc.exists()) {
          setError('Farmer not found');
          return;
        }

        const farmerData = { ...farmerDoc.data(), uid: farmerDoc.id } as FarmerWithLocation;
        setFarmer(farmerData);

        // Fetch farmer's products
        const allProducts = await getProducts({ limit: 100 });
        const farmerProducts = allProducts.filter(
          (p: Product) => p.farmerId === farmerId && p.status === 'active'
        );
        setProducts(farmerProducts);

      } catch (err: any) {
        console.error('Error fetching farmer data:', err);
        setError(err.message || 'Failed to load farmer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerData();
  }, [farmerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500">{error || 'Farmer not found'}</p>
        </div>
      </div>
    );
  }

  const locationDisplay = farmer.farmLocation
    ? `${farmer.farmLocation.barangay}, ${farmer.farmLocation.city}, ${farmer.farmLocation.province}`
    : farmer.farmAddress || 'Location not specified';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src={farmer.profileImage || '/placeholder-farmer.png'}
                alt={farmer.farmName || `${farmer.firstName} ${farmer.lastName}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {farmer.farmName || `${farmer.firstName}'s Farm`}
              </h1>
              <p className="text-gray-600 mt-1">
                by {farmer.firstName} {farmer.lastName}
              </p>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{locationDisplay}</span>
                </div>
                
                {farmer.farmType && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    <span>{farmer.farmType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Products ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No products available from this farmer yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/item/${product.id}`}
              >
                <img
                  src={product.image || '/placeholder-product.png'}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-primary text-sm font-bold mt-1">
                    ₱{product.price.toFixed(2)} / {product.unit}
                  </p>
                  {product.rating > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ★ {product.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}