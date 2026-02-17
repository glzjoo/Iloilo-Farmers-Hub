import HeroSectionSubscriptions from "../components/subscriptions/HeroSectionSubscriptions";
import SubscriptionServices from "../components/subscriptions/SubscriptionServices";
import SellerPlan from "../components/subscriptions/SellerPlan";
import SuccessStories from "../components/subscriptions/SuccessStories";


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