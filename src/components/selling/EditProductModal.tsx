import { useState, type FormEvent } from "react";
import AddProductImage from "./addproductimage";
import type { Product } from "../../types";
import addtocart from '../../assets/icons/add-to-cart.svg';
import minus from '../../assets/icons/minus.svg';
import { updateProduct } from "../../services/productService";
//editProductModall
interface EditProductModalProps {
    product: Product;
    onClose: () => void;
    onUpdateSuccess?: (updatedProduct: Product) => void;
}

export default function EditProductModal({ product, onClose, onUpdateSuccess }: EditProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newImageFile, setNewImageFile] = useState<File | null>(null);

    const [name, setName] = useState(product.name);
    const [category, setCategory] = useState(product.category);
    const [price, setPrice] = useState(product.price);
    const [unit, setUnit] = useState(product.unit);
    const [stockValue, setStockValue] = useState(() => {
        const match = product.stock.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
    });
    const [status, setStatus] = useState(product.status);
    const [description, setDescription] = useState(product.description || "");
    const [customCategory, setCustomCategory] = useState('');
    const [customUnit, setCustomUnit] = useState('');

    const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
    const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !price || stockValue < 0) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);

        try {
            const finalCategory = category === 'Other' ? customCategory.trim() : category;
            const finalUnit = unit === 'Other' ? customUnit.trim() : unit;
            const stockString = `${stockValue}${finalUnit}`;

            const updates: Partial<Omit<Product, 'id' | 'farmerId' | 'createdAt'>> = {
                name,
                category: finalCategory,
                price: Number(price),
                unit: finalUnit,
                stock: stockString,
                status,
                description,
            };

            await updateProduct(product.id, updates, newImageFile);

            const updatedProduct: Product = {
                ...product,
                ...updates,
                image: newImageFile ? URL.createObjectURL(newImageFile) : product.image,
            };

            onUpdateSuccess?.(updatedProduct);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto px-4 sm:px-12 py-6 sm:py-8 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6">
                    <h1 className="text-2xl font-bold font-primary">Edit Product</h1>
                    <p className="text-sm text-gray-500">Edit/Update your product</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        <div className="w-full md:w-[55%]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-5">
                                {/* Product Name */}
                                <div>
                                    <label className={labelClass}>Product Name *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Okra"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className={labelClass}>Category</label>
                                    {category === 'Other' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                placeholder="Type your category"
                                                className={inputClass}
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setCategory('Vegetables'); setCustomCategory(''); }}
                                                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer bg-transparent border-none"
                                                title="Back to list"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className={inputClass}
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
                                    )}
                                </div>

                                {/* Price */}
                                <div>
                                    <label className={labelClass}>Price (₱) *</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                {/* Unit */}
                                <div>
                                    <label className={labelClass}>Unit</label>
                                    {unit === 'Other' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={customUnit}
                                                onChange={(e) => setCustomUnit(e.target.value)}
                                                placeholder="Type your unit"
                                                className={inputClass}
                                                autoFocus
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setUnit('kg'); setCustomUnit(''); }}
                                                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer bg-transparent border-none"
                                                title="Back to list"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="ltr">Liters (ltr)</option>
                                            <option value="gallon">Gallons (gallon)</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    )}
                                </div>

                                {/* Stock Quantity */}
                                <div>
                                    <label className={labelClass}>Stock Quantity</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={stockValue}
                                            onChange={(e) => setStockValue(Number(e.target.value))}
                                            placeholder="0"
                                            min="0"
                                            className={`${inputClass} w-20`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setStockValue(Math.max(0, stockValue - 1))}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                        >
                                            <img src={minus} alt="" className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStockValue(stockValue + 1)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                        >
                                            <img src={addtocart} alt="" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                                        className={inputClass}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="col-span-1 sm:col-span-2">
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe your product..."
                                        rows={4}
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image upload */}
                        <div className="w-full md:w-[35%]">
                            <AddProductImage
                                initialImage={product.image}
                                onImageSelect={setNewImageFile}
                            />

                            <div className="flex justify-end gap-4 mt-7">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="w-[130px] py-2.5 rounded-lg bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-[150px] py-2.5 rounded-lg bg-primary text-white font-semibold cursor-pointer hover:bg-green-900 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Updating...' : 'Update Product'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}