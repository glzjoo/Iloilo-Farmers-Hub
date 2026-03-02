import { useState } from 'react';
import searchIcon from '../../assets/icons/search.svg';
import filterIcon from '../../assets/icons/Filter.svg';
import ListedProductCard from '../selling/ListedProductCard';
import EditProductModal from '../selling/EditProductModal';
import type { Product } from '../../types';
import okra from '../../assets/images/item-pictures/okra.png';
import kiwi from '../../assets/images/kiwi.png';
import carrots from '../../assets/images/carrots.png';

// Mock products
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Okra',
        price: 95.00,
        unit: 'kg',
        image: okra,
        description: 'Fresh okra, harvested daily',
        stock: '0kg',
        category: 'Vegetables',
        farmerId: 'farmer1',
        rating: 0,
        reviewCount: 0,
        status: 'active',
    },
    {
        id: '2',
        name: 'Carrots',
        price: 300.00,
        unit: 'kg',
        image: carrots,
        description: 'Description.....',
        stock: '45kg',
        category: 'Vegetables',
        farmerId: 'farmer1',
        rating: 0,
        reviewCount: 0,
        status: 'inactive',
    },
    {
        id: '3',
        name: 'Kiwi',
        price: 300.00,
        unit: 'kg',
        image: kiwi,
        description: 'Description....',
        stock: '0kg',
        category: 'Fruits',
        farmerId: 'farmer1',
        rating: 0,
        reviewCount: 0,
        status: 'active',
    },
];

export default function MyAccountFarmerListing() {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleDelete = (product: Product) => {
        console.log('Delete product:', product.id);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-primary">Listings</h2>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search listings..."
                            className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary w-[250px]"
                        />
                        <img src={searchIcon} alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                        Filters
                        <img src={filterIcon} alt="" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-6" />


            <div className="grid grid-cols-3 gap-6">
                {mockProducts
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product) => (
                        <ListedProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
}