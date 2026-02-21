import { useSearchParams } from "react-router-dom";
import ShopAll from "../components/shop/ShopAll";

export default function Shop() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-primary font-primary text-center mt-10">
                {searchQuery ? `Results for "${searchQuery}"` : 'SHOP ALL'}
            </h2>
            <ShopAll searchQuery={searchQuery} />
        </div>
    );
}
