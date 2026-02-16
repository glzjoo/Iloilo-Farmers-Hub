import HeroSectionSubscriptions from "../components/HeroSectionSubscriptions";
import SubscriptionServices from "../components/SubscriptionServices";
import SellerPlan from "../components/SellerPlan";
import SuccessStories from "../components/SuccessStories";


export default function Subscriptions() {
    return (
        <>
            <HeroSectionSubscriptions />
            <SubscriptionServices />
            <SellerPlan />
            <SuccessStories />
        </>
    );
}