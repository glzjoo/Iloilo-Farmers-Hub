import AddProductImage from "./addproductimage";

export default function AddProduct() {
    const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
    const labelClass = "block text-sm font-semibold text-gray-800 mb-1";

    return (
        <section className="px-20 py-10">
            <div className="mb-6">
                <h1 className="text-4xl font-bold font-primary">Add New Product</h1>
                <p className="mt-2 text-gray-500">Fill in the details for your new product</p>
            </div>

            {/* form on left */}
            <div className="flex gap-8 items-start">
                {/* Form fields */}
                <div className="w-[55%]">
                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                        {/* Product Name */}
                        <div>
                            <label className={labelClass}>Product Name</label>
                            <input type="text" placeholder="e.g., Okra" className={inputClass} />
                        </div>

                        {/* Category */}
                        <div>
                            <label className={labelClass}>Category</label>
                            <select className={inputClass}>
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
                            <input type="number" placeholder="0" min="0" className={inputClass} />
                        </div>

                        {/* Unit */}
                        <div>
                            <label className={labelClass}>Unit</label>
                            <select className={inputClass}>
                                <option value="Kg">Kilogram (kg)</option>
                                <option value="Pcs">Pieces (pcs)</option>
                                <option value="Ltr">Liters (ltr)</option>
                                <option value="Gallon">Gallons (gallon)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Stock Quantity */}
                        <div>
                            <label className={labelClass}>Stock Quantity</label>
                            <input type="number" placeholder="0" min="0" className={inputClass} />
                        </div>

                        {/* Status */}
                        <div>
                            <label className={labelClass}>Status</label>
                            <select className={inputClass}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea
                                placeholder="Describe your product..."
                                rows={4}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>
                </div>

                {/*Image upload */}
                <div className="w-[35%]">
                    <AddProductImage />

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            type="button"
                            className="px-10 py-2.5 rounded-lg bg-red-500 text-white font-semibold cursor-pointer hover:bg-red-600 transition-colors"
                        >
                            Cancel
                        </button>
                        {/* no functionalties yet when clicked */}
                        <button
                            type="submit"
                            className="px-10 py-2.5 rounded-lg bg-primary text-white font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                        >
                            Add Product
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}