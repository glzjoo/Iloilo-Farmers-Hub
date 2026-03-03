import type { Product } from '../../types';
import edit from '../../assets/images/Edit.svg';
import deleteIcon from '../../assets/images/delete.svg';

interface ListedProductCardProps {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
    isDeleting?: boolean;
}

export default function ListedProductCard({ product, onEdit, onDelete, isDeleting }: ListedProductCardProps) {
    return (
        <div className={`border border-gray-300 rounded-[15px] bg-white overflow-hidden ${isDeleting ? 'opacity-50' : ''}`}>
            {/* Product Image */}
            <div className="w-full h-[200px] overflow-hidden bg-gray-100">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-black">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-black">₱{product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">per {product.unit}</p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                    {product.description || 'No description'}
                </p>

                {/* Stock */}
                <p className="text-sm mt-2">
                    Stock: <span className="text-primary font-semibold">{product.stock}</span>
                </p>

                {/* Actions row */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        {/* Delete button */}
                        <button
                            onClick={() => onDelete?.(product)}
                            disabled={isDeleting}
                            className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-red-50 transition-colors disabled:cursor-not-allowed"
                            title="Delete product"
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <img src={deleteIcon} alt="Delete" className="w-4 h-4" />
                            )}
                        </button>

                        {/* Edit */}
                        <button
                            onClick={() => onEdit?.(product)}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-14 py-1.5 border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50 transition-colors text-sm disabled:cursor-not-allowed"
                        >
                            <img src={edit} alt="" className="w-4 h-4" />
                            Edit
                        </button>
                    </div>

                    {/* Status */}
                    <span className={`text-sm font-bold ${product.status === 'active' ? 'text-primary' : 'text-red-500'}`}>
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        </div>
    );
}