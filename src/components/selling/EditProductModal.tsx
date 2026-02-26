import AddProductImage from "./AddProductImage";
import { useState } from "react";
import type { Product } from "../../types";
import addtocart from '../../assets/icons/add-to-cart.svg'
import minus from '../../assets/icons/minus.svg'


interface EditProductModalProps {
    product: Product;
    onClose: () => void;
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
    const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
    const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

    const [name, setName] = useState(product.name);
    const [category, setCategory] = useState(product.category);
    const [price, setPrice] = useState(product.price);
    const [unit, setUnit] = useState(product.unit);
    const [stock, setStock] = useState(parseInt(product.stock) || 0);
    const [status, setStatus] = useState(product.status);
    const [description, setDescription] = useState(product.description || "");

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            {/* Modal content */}
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-[900px] max-h-[90vh] overflow-y-auto px-12 py-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6">
                    <h1 className="text-2xl font-bold font-primary">Edit Product</h1>
                    <p className="text-sm text-gray-500">Edit/Update your product</p>
                </div>

                <div className="flex gap-8 items-start">
                    <div className="w-[55%]">
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                            {/* Product Name */}
                            <div>
                                <label className={labelClass}>Product Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Okra"
                                    className={inputClass}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className={labelClass}>Category</label>
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
                            </div>

                            {/* Price */}
                            <div>
                                <label className={labelClass}>Price (₱)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    placeholder="0"
                                    min="0"
                                    className={inputClass}
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className={labelClass}>Unit</label>
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
                            </div>

                            {/* Stock Quantity */}
                            <div>
                                <label className={labelClass}>Stock Quantity</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(Number(e.target.value))}
                                        placeholder="0"
                                        min="0"
                                        className={`${inputClass} w-16`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setStock(Math.max(0, stock - 1))}
                                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white text-lg font-bold"
                                    >
                                        <img src={minus} alt="" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStock(stock + 1)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white text-lg font-bold transition-colors"
                                    >
                                        <img src={addtocart} alt="" />
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
                            <div className="col-span-2">
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
                    <div className="w-[35%]">
                        <AddProductImage initialImage={product.image} />

                        <div className="flex justify-end gap-4 mt-7">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-[130px] py-2.5 rounded-lg bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors"
                            >
                                Cancel
                            </button>
                            {/* add : update product button functionality*/}
                            <button
                                type="submit"
                                className="w-[150px] py-2.5 rounded-lg bg-primary text-white font-semibold cursor-pointer hover:bg-green-900 transition-colors"
                            >
                                Update Product
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}