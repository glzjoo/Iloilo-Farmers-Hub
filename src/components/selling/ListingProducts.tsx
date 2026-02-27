import mylisting from '../../assets/icons/mylisting.svg';
import searchIcon from '../../assets/icons/search.svg';
import ListedProductCard from './ListedproductCard';
import EditProductModal from './EditProductModal';
import type { Product } from '../../types';
import { useState } from 'react';
import okra from '../../assets/images/item-pictures/okra.png';
import kiwi from '../../assets/images/kiwi.png';
import carrots from '../../assets/images/carrots.png';

// Mock data 
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
    {
        id: '4',
        name: 'Okra',
        price: 95.00,
        unit: 'kg',
        image: okra,
        description: 'Fresh okra, harvested daily',
        stock: '65kg',
        category: 'Vegetables',
        farmerId: 'farmer1',
        rating: 0,
        reviewCount: 0,
        status: 'active',
    },
    {
        id: '5',
        name: 'Carrots',
        price: 300.00,
        unit: 'kg',
        image: carrots,
        description: 'Description....',
        stock: '65kg',
        category: 'Vegetables',
        farmerId: 'farmer1',
        rating: 0,
        reviewCount: 0,
        status: 'inactive',
    },
    {
        id: '6',
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

export default function ListingProducts() {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleDelete = (product: Product) => {
        // TODO: Implement delete with Firebase
        console.log('Delete product:', product.id);
    };

    return (
        <section className="max-w-7xl mx-auto px-10 py-8">
            <div className="flex items-center gap-4 mb-2">
                <img src={mylisting} alt="My Listing" className="w-8 h-8" />
                <h1 className="text-3xl font-bold">My Listing</h1>
                <div className="relative ml-6">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-4 pr-10 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-[400px] text-sm"
                    />
                    <img src={searchIcon} alt="Search" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                </div>
            </div>

            <h2 className="text-xl font-semibold mt-4 mb-6">Your listed products</h2>

            {/* Products */}
            <div className="grid grid-cols-3 gap-6">
                {mockProducts.map((product) => (
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
        </section>
    );
}