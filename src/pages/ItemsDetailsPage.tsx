import ItemSection from "../components/shop/ItemSection";
import RelatedProducts from "../components/shop/RelatedProducts";
import ItemReview from "../components/reviews/ItemReview";

export default function ItemsDetailsPage() {
    return (
        <>
            <ItemSection />
            <RelatedProducts />
            <ItemReview />
        </>
    );
}