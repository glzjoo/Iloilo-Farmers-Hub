import SellerPlan from "../components/SellerPlan";

export default function Discounts() {
    return (
        <>
            <section className="w-full py-12">
                <div className="max-w-7xl mx-auto px-10">
                    <h1 className="text-5xl  text-center font-bold text-dark">Get 50% Off Your First 3 Months</h1>
                    <p className="text-lg  text-center font-semibold text-dark mt-5">Start selling and save big. Limited slots available
                        for new sellers this month.</p>
                </div>
            </section>
            <SellerPlan />
        </>
    );
}