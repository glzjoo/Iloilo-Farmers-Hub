import filter from '../../assets/icons/filter.svg';

const trendingItems = ['avocado', 'bananas', 'rice', 'chicken'];
const sortOptions = ['Rating', 'Newest'];
const categoryOptions = [
    'fresh produce',
    'grains & rice',
    'poultry',
    'seafood',
    'processed goods',
    'seeds',
    'farm products',
];
const priceOptions = ['High-Low', 'Low-High'];

export default function SidebarFilter() {
    return (
        <aside className="w-full h-full bg-white border-r border-gray-100 pr-4">
            <h2 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider flex items-center gap-2">
                <img src={filter} className="w-5 h-5" />
                Search Filter
            </h2>

            {/* Trending */}
            <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">Trending</h3>
                <ul className="list-none p-0 m-0 flex flex-col gap-3">
                    {trendingItems.map((item) => (
                        <li key={item}>
                            <a href="#" className="text-primary text-[13px] font-semibold underline hover:text-green-900 transition-colors">
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Sort by */}
            <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">Sort by</h3>
                <div className="flex flex-col gap-3">
                    {sortOptions.map(option => (
                        <label key={option} className="flex items-start gap-3 cursor-pointer group">
                            <input type="radio" name="sort" id={`sort-${option}`} className="w-[14px] h-[14px] mt-0.5 border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer" />
                            <span className="text-sm text-gray-700 group-hover:text-primary transition-colors leading-tight capitalize">{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Category */}
            <div className="border-b border-gray-200 pb-5 mb-5">
                <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">Category</h3>
                <div className="flex flex-col gap-3">
                    {categoryOptions.map(option => (
                        <label key={option} className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" id={`cat-${option}`} className="w-[14px] h-[14px] mt-0.5 rounded-sm border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer" />
                            <span className="text-sm text-gray-700 group-hover:text-primary transition-colors leading-tight capitalize">{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="pb-5">
                <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">Price</h3>
                <div className="flex flex-col gap-3">
                    {priceOptions.map(option => (
                        <label key={option} className="flex items-start gap-3 cursor-pointer group">
                            <input type="radio" name="price" id={`price-${option}`} className="w-[14px] h-[14px] mt-0.5 border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer" />
                            <span className="text-sm text-gray-700 group-hover:text-primary transition-colors leading-tight capitalize">{option}</span>
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}
