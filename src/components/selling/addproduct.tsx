import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AddProductImage from "./AddProductImage";
import { useAuth } from "../../context/AuthContext";
import { addProduct } from "../../services/productService";
import type { Product } from "../../types";

export default function AddProduct() {
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetables',
        price: '',
        unit: 'kg',
        stock: '',
        status: 'active' as 'active' | 'inactive',
        description: '',
    });

    const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
    const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user || !userProfile) {
            setError('You must be logged in to add a product');
            return;
        }

        if (userProfile.role !== 'farmer') {
            setError('Only farmers can add products');
            return;
        }

        // Validate all required fields
        if (!formData.name.trim()) {
            setError('Product name is required');
            return;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            setError('Valid price is required');
            return;
        }

        if (!formData.stock.trim()) {
            setError('Stock quantity is required');
            return;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }

        if (!selectedImage) {
            setError('Product image is required');
            return;
        }

        setIsLoading(true);

        try {
            const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: formData.name.trim(),
                price: Number(formData.price),
                category: formData.category,
                unit: formData.unit,
                stock: formData.stock.trim(),
                status: formData.status,
                description: formData.description.trim(),
                farmerId: user.uid,
                image: '',
                rating: 0,
                reviewCount: 0,
                farmerName: userProfile.displayName || 'Unknown Farmer',
            };

            await addProduct(
                productData,
                selectedImage,
                userProfile.displayName || 'Unknown Farmer'
            );

            navigate('/my-listings');
        } catch (err: any) {
            setError(err.message || 'Failed to add product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/my-listings');
    };

    return (
        <section className="px-20 py-10">
            <div className="mb-6">
                <h1 className="text-4xl font-bold font-primary">Add New Product</h1>
                <p className="mt-2 text-gray-500">Fill in the details for your new product</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="flex gap-8 items-start">
                    {/* Form fields */}
                    <div className="w-[55%]">
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                            {/* Product Name */}
                            <div>
                                <label className={labelClass}>
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Okra" 
                                    className={inputClass}
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className={labelClass}>
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Rice">Rice</option>
                                    <option value="Corn">Corn</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Livestock">Livestock</option>
                                    <option value="Poultry">Poultry</option>
                                    <option value="Fishery">Fishery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Price */}
                            <div>
                                <label className={labelClass}>
                                    Price (₱) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0" 
                                    min="0.01" 
                                    step="0.01"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className={labelClass}>
                                    Unit <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="ltr">Liters (ltr)</option>
                                    <option value="gallon">Gallons (gallon)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Stock Quantity */}
                            <div>
                                <label className={labelClass}>
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 50kg or 100pcs" 
                                    className={inputClass}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className={labelClass}>
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="col-span-2">
                                <label className={labelClass}>
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your product..."
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image upload */}
                    <div className="w-[35%]">
                        <AddProductImage onImageSelect={setSelectedImage} />
                        
                        {!selectedImage && (
                            <p className="text-red-500 text-sm mt-2">
                                * Product image is required
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="px-10 py-2.5 rounded-lg bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 py-2.5 rounded-lg bg-primary text-white font-semibold cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    );
}