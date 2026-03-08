

export default function BecomeAsellerSection() {
    return (
        <section className="w-full min-h-fit relative pb-20">
            <h1 className="text-5xl text-center font-primary font-semibold text-primary pt-10 pb-11">Become a Seller at Iloilo
                Farmers Hub</h1>
            <p className="text-center text-xl font-primary text-black mb-10 px-10 pb-10">Join Iloilo Farmers Hub and start selling your fresh produce directly to
                consumers. No middlemen, better prices, grow your farm business.</p>
            <div className="flex justify-center gap-10 px-10">
                {/* Left Column */}
                <div className="max-w-xl flex flex-col">
                    <h2 className="text-2xl font-primary font-bold italic text-black mb-4">Who Can Join?</h2>
                    <p className="text-base font-primary text-black mb-2">We welcome:</p>
                    <ul className="list-disc text-base font-primary text-black pl-6 mb-8">
                        <li>Local farmers and producers</li>
                        <li>Small business owners selling agricultural products</li>
                        <li>Cooperatives and community-based sellers in Iloilo</li>
                    </ul>

                    <h2 className="text-2xl font-primary font-bold italic text-black mb-4">Why Sell With Us?</h2>
                    <p className="text-base font-primary text-black mb-2">By joining Iloilo Farmers Hub, you can:</p>
                    <ul className="list-disc text-base font-primary text-black pl-6 mb-8">
                        <li>Reach more customers online</li>
                        <li>Promote fresh and local products</li>
                        <li>Manage your products and prices easily</li>
                        <li>Track orders and sales in one place</li>
                        <li>Be part of a trusted local marketplace</li>
                    </ul>

                    <h2 className="text-2xl font-primary font-bold italic text-black mb-4">What You Need to Get Started</h2>
                    <p className="text-base font-primary text-black mb-2">Prepare the following before registering:</p>
                    <ul className="list-disc text-base font-primary text-black pl-6">
                        <li>A valid ID</li>
                        <li>Basic seller or farm information</li>
                        <li>Product details (name, price, quantity, and description)</li>
                        <li>Active contact information</li>
                    </ul>
                </div>

                {/* Center divider line */}
                <div className="w-0.5 bg-black self-stretch"></div>

                {/* Right Column */}
                <div className="max-w-xl flex flex-col">
                    <h2 className="text-2xl font-primary font-bold italic text-black mb-4">How to Become a Seller</h2>
                    <p className="text-base font-primary text-black mb-2">Follow these simple steps:</p>
                    <ol className="list-decimal text-base font-primary text-black pl-6 mb-8">
                        <li>Create an account on the Iloilo Farmers Hub website</li>
                        <li>Choose Register as Seller</li>
                        <li>Complete your seller profile</li>
                        <li>Submit the required information for verification</li>
                        <li>Wait for approval from the administrator</li>
                        <li>Start adding products and selling online</li>
                    </ol>

                    <h2 className="text-2xl font-primary font-bold italic text-black mb-4">Seller Responsibilities</h2>
                    <p className="text-base font-primary text-black mb-2">To keep the marketplace safe and reliable, sellers should:</p>
                    <ul className="list-disc text-base font-primary text-black pl-6 mb-10">
                        <li>Provide accurate product information</li>
                        <li>Keep prices and stock updated</li>
                        <li>Ensure product quality</li>
                        <li>Communicate clearly with customers</li>
                        <li>Follow the platform&apos;s rules and guidelines</li>
                    </ul>

                    <button className="w-fit bg-primary text-white text-lg font-medium px-8 py-3 rounded-full cursor-pointer mt-auto border-none">
                        Register as a seller
                    </button>
                </div>
            </div>
        </section>
    );
}
